const cron = require('node-cron');
const Task = require('../models/Task');
const sendEmail = require('./sendEmail');

// Helper to combine date and time strings into a Date object
function combineDateTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

async function sendReminders() {
  try {
    const now = new Date();

    const tasksToRemind = await Task.find({
      completed: false,
      reminderSent: false,
      deadline: { $gt: now }
    }).populate('userId');

    console.log(`Found ${tasksToRemind.length} tasks to remind`);

    for (const task of tasksToRemind) {
      console.log(`Processing task: ${task.title}, userId: ${task.userId}`);
      if (!task.userId) {
        console.log(`Task ${task.title} has null userId, skipping`);
        continue;
      }
      const userEmail = task.userId.email;
      if (!userEmail) {
        console.log(`Task ${task.title} user has no email, skipping`);
        continue;
      }

      // Calculate reminder time based on reminderMinutes
      const reminderTime = new Date(task.deadline.getTime() - (task.reminderMinutes || 10) * 60000);

      if (now >= reminderTime) {
        const subject = `Reminder: Task "${task.title}" is due soon`;
        const text = `Your task "${task.title}" is due at ${task.deadline.toLocaleString()}. Please complete it before the deadline.`;

        await sendEmail(userEmail, subject, text, 'reminder');

        task.reminderSent = true;
        await task.save();
      }
    }
  } catch (error) {
    console.error('Error sending task reminders:', error);
  }
}

// Mark overdue tasks as incomplete and notify user if not already notified
async function handleOverdueTasks() {
  try {
    const now = new Date();

    const overdueTasks = await Task.find({
      completed: false,
      overdueNotified: false,
      deadline: { $lt: now }
    }).populate('userId');

    console.log(`Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      console.log(`Processing overdue task: ${task.title}, userId: ${task.userId}`);
      if (!task.userId) {
        console.log(`Overdue task ${task.title} has null userId, skipping`);
        continue;
      }
      const userEmail = task.userId.email;
      if (!userEmail) {
        console.log(`Overdue task ${task.title} user has no email, skipping`);
        continue;
      }

      const subject = `Task Overdue: "${task.title}" deadline has passed`;
      const text = `Your task "${task.title}" was due on ${task.deadline.toLocaleString()} and is now marked as incomplete. Please review it.`;

      await sendEmail(userEmail, subject, text, 'overdue');

      task.overdueNotified = true;
      await task.save();
    }
  } catch (error) {
    console.error('Error handling overdue tasks:', error);
  }
}

// Schedule the tasks to run every minute
function startTaskScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running task scheduler checks...');
    await sendReminders();
    await handleOverdueTasks();
  });
}

module.exports = {
  startTaskScheduler,
};

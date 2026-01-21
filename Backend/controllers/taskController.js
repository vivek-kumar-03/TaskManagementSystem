const Task = require('../models/Task');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, setTime, completed, startDate, startTime, reminderMinutes } = req.body;

    // Validate required fields
    if (!title || !deadline || !setTime || !startDate || !startTime) {
      return res.status(400).json({ error: 'Title, start date, start time, deadline, and set time are required' });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    // Validate setTime
    if (!Number.isInteger(setTime) || setTime <= 0) {
      return res.status(400).json({ error: 'Set time must be a positive integer' });
    }

    // Validate startTime format HH:MM
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({ error: 'Start time must be in HH:MM format' });
    }

    const task = new Task({
      userId: req.user.id,
      title,
      description: description || '',
      priority: priority || 'medium',
      startDate,
      startTime,
      deadline,
      reminderMinutes: reminderMinutes || 10,
      setTime,
      completed: completed || false,
      reminderSent: false,
      overdueNotified: false,
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all tasks for the authenticated user
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', priority, completed } = req.query;
    
    // Build filter object
    const filter = { userId: req.user.id };
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    
    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const tasks = await Task.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count for pagination
    const total = await Task.countDocuments(filter);
    
    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a single task by ID
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, setTime, completed, startDate, startTime, reminderMinutes } = req.body;

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Priority must be low, medium, or high' });
      }
    }

    // Validate setTime if provided
    if (setTime !== undefined && (!Number.isInteger(setTime) || setTime <= 0)) {
      return res.status(400).json({ error: 'Set time must be a positive integer' });
    }

    // Validate startTime format HH:MM if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime !== undefined && !timeRegex.test(startTime)) {
      return res.status(400).json({ error: 'Start time must be in HH:MM format' });
    }

    // Get the current task to check if completion status changed
    const currentTask = await Task.findOne({ _id: req.params.id, userId: req.user.id }).populate('userId');

    const updateFields = { title, description, priority, deadline, setTime, completed };

    if (startDate !== undefined) updateFields.startDate = startDate;
    if (startTime !== undefined) updateFields.startTime = startTime;
    if (reminderMinutes !== undefined) updateFields.reminderMinutes = reminderMinutes;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Send completion thank you email if task was just completed
    if (completed === true && currentTask && currentTask.completed === false) {
      const userEmail = currentTask.userId.email;
      if (userEmail) {
        const subject = `Congratulations! Task "${task.title}" completed`;
        const text = `Great job! You have successfully completed your task "${task.title}". Keep up the excellent work!`;

        // Send email asynchronously (don't wait for it)
        const sendEmail = require('../utils/sendEmail');
        sendEmail(userEmail, subject, text, 'completion').catch(err => {
          console.error('Error sending completion email:', err);
        });
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: error.message });
  }
};
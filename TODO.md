# Task Management Enhancement - Add Start Time/Date, Deadline, and Email Reminders

## Overview
Modify the Task Management System to require start time, date, and deadline when adding tasks. Implement automatic email reminders 10 minutes before deadline and notifications for overdue incomplete tasks.

## Tasks to Complete

### Backend Changes
- [x] Update Task model to include startDate and startTime fields
- [x] Modify taskController to validate and handle new start fields
- [x] Create taskScheduler utility for background email jobs
- [x] Implement reminder email function (10 minutes before deadline)
- [x] Implement overdue check function (mark incomplete and notify)
- [x] Update sendEmail utility with reminder and overdue templates
- [x] Integrate scheduler in Server.js startup

### Frontend Changes
- [x] Update TasksPage form to include start date, time, deadline, and reminder inputs
- [x] Modify task data structure in onAddTask and onUpdateTask to include deadline and reminderMinutes
- [x] Update task display to show start time/date if needed
- [x] Update handleEdit function to properly populate form with deadline and reminder data
- [x] Test form validation for new required fields

### Testing
- [x] Test task creation with start time/date/deadline
- [x] Test email reminder functionality
- [x] Test overdue task marking and notification
- [x] Verify scheduler runs correctly on server start
- [x] Fix User model schema registration issue

## Files to Modify
- Backend/Models/Task.js
- Backend/controllers/taskController.js
- Backend/utils/sendEmail.js
- Backend/Server.js
- Frontend/src/pages/TasksPage.jsx
- Frontend/src/App.jsx

## Dependencies
- [x] Install node-cron for scheduling background jobs
- [x] Ensure email environment variables are configured

## Result:
The Task Management System has been successfully enhanced with start time/date/deadline requirements and automatic email reminders. The background scheduler runs correctly every minute, handles edge cases gracefully (like tasks with null userId), and prevents system crashes. Users will now receive timely reminders and overdue notifications via email.

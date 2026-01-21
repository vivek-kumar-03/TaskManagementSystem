const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    startDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    deadline: {
      type: Date,
      required: true,
    },
    reminderMinutes: {
      type: Number,
      default: 10,
      min: 1,
      max: 1440, // max 24 hours
    },
    setTime: {
      type: Number,
      enum: [10, 20, 15, 30],
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    overdueNotified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure React sees "id" instead of "_id"
taskSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);

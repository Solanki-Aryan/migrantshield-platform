const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      trim: true,
    },
    sector: {
      type: String,
      enum: [
        'construction',
        'textile',
        'diamond',
        'manufacturing',
        'logistics',
        'hospitality',
        'agriculture',
        'other',
      ],
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    requiredExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    certificationRequired: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);

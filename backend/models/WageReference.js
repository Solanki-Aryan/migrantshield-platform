const mongoose = require('mongoose');

const wageReferenceSchema = new mongoose.Schema(
  {
    occupation: {
      type: String,
      required: [true, 'Occupation is required'],
      trim: true,
    },
    sector: {
      type: String,
      required: [true, 'Sector is required'],
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
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    skillLevel: {
      type: String,
      enum: ['unskilled', 'semi-skilled', 'skilled', 'highly-skilled'],
      default: 'unskilled',
    },
    minimumWage: {
      type: Number,
      required: [true, 'Minimum wage is required'],
      min: 0,
    },
    wageUnit: {
      type: String,
      enum: ['daily', 'monthly', 'hourly'],
      default: 'daily',
    },
    workingHoursAssumption: {
      type: Number,
      default: 8,
    },
    overtimeMultiplier: {
      type: Number,
      default: 2.0,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
    },
    source: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

wageReferenceSchema.index({ sector: 1, state: 1, occupation: 1 });

module.exports = mongoose.model('WageReference', wageReferenceSchema);

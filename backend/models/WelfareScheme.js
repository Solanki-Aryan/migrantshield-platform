const mongoose = require('mongoose');

const welfareSchemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      unique: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    state: {
      type: String,
      default: 'central',
      trim: true,
    },
    eligibility: {
      minAge: { type: Number, min: 0 },
      maxAge: { type: Number, max: 120 },
      maxIncome: { type: Number, min: 0 },
      occupations: [{ type: String, trim: true }],
      sectors: [
        {
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
            'all',
          ],
        },
      ],
    },
    requiredDocuments: [{ type: String, trim: true }],
    benefits: {
      type: String,
      trim: true,
    },
    applicationProcedure: {
      type: String,
      trim: true,
    },
    officialSource: {
      type: String,
      trim: true,
    },
    effectiveDate: {
      type: Date,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WelfareScheme', welfareSchemeSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const employerSchema = new mongoose.Schema(
  {
    employerId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    contractorInfo: {
      licenseNumber: { type: String, trim: true },
      registeredUnder: { type: String, trim: true },
    },
    industry: {
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
    workplaceLocations: [
      {
        state: { type: String, trim: true },
        district: { type: String, trim: true },
        city: { type: String, trim: true },
        address: { type: String, trim: true },
      },
    ],
    workerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    compliance: {
      wageCompliance: { type: Boolean, default: true },
      safetyCompliance: { type: Boolean, default: true },
      lastAudit: { type: Date },
    },
    complaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grievance',
      },
    ],
    wageViolations: {
      type: Number,
      default: 0,
      min: 0,
    },
    safetyIncidents: {
      type: Number,
      default: 0,
      min: 0,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employer', employerSchema);

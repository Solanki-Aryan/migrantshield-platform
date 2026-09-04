const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    workerId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    personalDetails: {
      name: { type: String, trim: true },
      dob: { type: Date },
      gender: { type: String, enum: ['male', 'female', 'other'] },
      aadhaar: {
        type: String,
        trim: true,
        match: [/^\d{12}$/, 'Aadhaar must be 12 digits'],
        select: false,
      },
    },
    homeState: { type: String, trim: true },
    homeDistrict: { type: String, trim: true },
    currentState: { type: String, trim: true },
    currentDistrict: { type: String, trim: true },
    currentCity: { type: String, trim: true },
    migrationHistory: [
      {
        state: { type: String },
        district: { type: String },
        from: { type: Date },
        to: { type: Date },
      },
    ],
    occupation: { type: String, trim: true },
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
    experience: { type: Number, min: 0, max: 50 }, // years
    skills: [
      {
        skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
        verified: { type: Boolean, default: false },
      },
    ],
    dailyWage: { type: Number, min: 0 },
    monthlyWage: { type: Number, min: 0 },
    workingHoursPerDay: { type: Number, min: 0, max: 24 },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['aadhaar', 'pan', 'voter_id', 'bank_passbook', 'skill_certificate', 'other'],
        },
        url: { type: String },
        status: {
          type: String,
          enum: ['uploaded', 'verified', 'rejected'],
          default: 'uploaded',
        },
      },
    ],
    welfareStatus: [
      {
        schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'WelfareScheme' },
        applicationStatus: {
          type: String,
          enum: ['eligible', 'applied', 'approved', 'rejected', 'pending'],
          default: 'eligible',
        },
        appliedDate: { type: Date },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worker', workerSchema);

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const grievanceSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, 'Worker reference is required'],
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'wage_dispute',
        'unsafe_workplace',
        'harassment',
        'excessive_hours',
        'no_safety_equipment',
        'workplace_injury',
        'forced_labor',
        'accommodation',
        'other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      workplace: { type: String, trim: true },
    },
    evidence: [
      {
        type: { type: String, enum: ['image', 'document', 'video', 'other'] },
        url: { type: String },
      },
    ],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'assigned',
        'under_investigation',
        'action_taken',
        'resolved',
      ],
      default: 'submitted',
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      trim: true,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalationReason: {
      type: String,
      trim: true,
    },
    timestamps: {
      submitted: { type: Date, default: Date.now },
      assigned: { type: Date },
      resolved: { type: Date },
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    aiClassification: {
      category: { type: String },
      intent: { type: String },
      entities: [{ type: String }],
    },
  },
  { timestamps: true }
);

grievanceSchema.index({ workerId: 1, status: 1 });
grievanceSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model('Grievance', grievanceSchema);

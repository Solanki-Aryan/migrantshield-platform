const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    industrialArea: {
      type: String,
      trim: true,
    },
    workplaceType: {
      type: String,
      enum: ['factory', 'construction_site', 'farm', 'shop', 'household', 'office', 'other'],
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
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
    workerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

locationSchema.index({ state: 1, district: 1 });
locationSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Location', locationSchema);

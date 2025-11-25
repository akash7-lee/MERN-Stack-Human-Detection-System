const mongoose = require('mongoose');

const DetectionSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  peopleCount: {
    type: Number,
    required: true
  },
  detections: [{
    bbox: [Number],
    score: Number,
    class: String
  }],
  avgConfidence: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Detection', DetectionSchema);
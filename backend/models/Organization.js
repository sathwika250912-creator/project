const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Optional reference to a parent board (education board)
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  settings: {
    theme: {
      type: String,
      default: 'light'
    },
    features: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  subscriptionExpires: {
    type: Date
  }
}, {
  timestamps: true
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;

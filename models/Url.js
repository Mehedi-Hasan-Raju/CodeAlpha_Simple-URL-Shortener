const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

// MongoDB automatically document delete when the expiresAt data is reached
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Url', urlSchema);
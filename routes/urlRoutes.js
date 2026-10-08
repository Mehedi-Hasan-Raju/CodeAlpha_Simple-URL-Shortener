const express = require('express');
const crypto = require('crypto');
const Url = require('../models/Url');

const router = express.Router();

const ALIAS_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const RESERVED_ALIASES = ['api'];

const generateCode = () => crypto.randomBytes(5).toString('base64url').slice(0, 7);

const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const formatResponse = (doc) => ({
  shortCode: doc.shortCode,
  shortUrl: `${process.env.BASE_URL}/${doc.shortCode}`,
  originalUrl: doc.originalUrl,
  expiresAt: doc.expiresAt,
});

// POST /api/shorten
// body: { "url": "...", "alias": "my-link" (optional), "expiresInDays": 7 (optional) }
router.post('/api/shorten', async (req, res) => {
  const { url, alias, expiresInDays } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid http/https URL' });
  }

  // Alias validation
  if (alias) {
    if (!ALIAS_REGEX.test(alias)) {
      return res.status(400).json({
        error: 'Alias must be 3-30 characters: letters, numbers, - or _ only',
      });
    }
    if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
      return res.status(400).json({ error: 'This alias is reserved' });
    }
  }

  // Expiry validation
  let expiresAt = null;
  if (expiresInDays !== undefined && expiresInDays !== '') {
    const days = Number(expiresInDays);
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      return res.status(400).json({ error: 'expiresInDays must be between 1 and 365' });
    }
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  try {
    // Custom alias
    if (alias) {
      try {
        const doc = await Url.create({ shortCode: alias, originalUrl: url, expiresAt });
        return res.status(201).json(formatResponse(doc));
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: 'This alias is already taken' });
        }
        throw err;
      }
    }

    // Random code. Reuse hoy shudhu jodi alias/expiry na thake
    let doc = null;
    if (!expiresAt) {
      doc = await Url.findOne({ originalUrl: url, expiresAt: null });
    }

    for (let i = 0; !doc && i < 5; i++) {
      try {
        doc = await Url.create({ shortCode: generateCode(), originalUrl: url, expiresAt });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }

    if (!doc) return res.status(500).json({ error: 'Could not generate a unique code' });

    res.status(201).json(formatResponse(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:shortCode
router.get('/:shortCode', async (req, res) => {
  try {
    // Expired document ke match-i korbe na (TTL cleaner er delay-er jonno)
    const doc = await Url.findOneAndUpdate(
      {
        shortCode: req.params.shortCode,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
      { $inc: { clicks: 1 } }
    );

    if (!doc) return res.status(404).json({ error: 'Short URL not found or expired' });

    res.redirect(doc.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
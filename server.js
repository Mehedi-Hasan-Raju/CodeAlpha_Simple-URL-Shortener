require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const urlRoutes = require('./routes/urlRoutes');

const app = express();

// Deploy korle (Render, Railway etc.) proxy-r pichone thake, tai eta lagbe
// app.set('trust proxy', 1);

const shortenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,           // prati IP theke max 10 request
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a minute' },
});

app.use(express.json());
app.use(express.static('public'));
app.use('/api/shorten', shortenLimiter); // shudhu shorten endpoint-e, redirect-e na
app.use('/', urlRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error('DB connection error:', err));
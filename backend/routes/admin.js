'use strict';

const express      = require('express');
const path         = require('path');
const adminAuth    = require('../middleware/adminAuth');
const { createPost, deletePost } = require('../controllers/adminController');

const router = express.Router();

// Serve admin panel HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin.html'));
});

// Protected API routes
router.post('/posts',         adminAuth, createPost);
router.delete('/posts/:slug', adminAuth, deletePost);

module.exports = router;

'use strict';

const BlogPost = require('../models/BlogPost');
const AppError = require('../utils/AppError');

// Returns all published MongoDB posts (source = "mongo" only).
// Never touches or references Framer static blog content.
async function getAllMongoPosts(req, res, next) {
  try {
    const posts = await BlogPost.find({ source: 'mongo', status: 'published' })
      .select('title slug excerpt coverImage createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
}

// Returns a single published MongoDB post by slug (source = "mongo" only).
async function getSingleMongoPostBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string') {
      return next(new AppError('Slug is required', 400));
    }

    const post = await BlogPost.findOne({
      slug:   slug.trim().toLowerCase(),
      source: 'mongo',
      status: 'published',
    }).select('-__v');

    if (!post) {
      return next(new AppError('Post not found', 404));
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllMongoPosts, getSingleMongoPostBySlug };

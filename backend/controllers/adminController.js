'use strict';

const BlogPost  = require('../models/BlogPost');
const AppError  = require('../utils/AppError');

async function createPost(req, res, next) {
  try {
    const { title, slug, content, excerpt, coverImage, seoTitle, seoDescription } = req.body;

    if (!title || !title.trim())   return next(new AppError('Title is required', 400));
    if (!slug  || !slug.trim())    return next(new AppError('Slug is required', 400));
    if (!content || !content.trim()) return next(new AppError('Content is required', 400));

    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await BlogPost.findOne({ slug: cleanSlug });
    if (existing) return next(new AppError('A post with this slug already exists', 409));

    const post = await BlogPost.create({
      title:          title.trim(),
      slug:           cleanSlug,
      content:        content.trim(),
      excerpt:        excerpt?.trim(),
      coverImage:     coverImage?.trim(),
      seoTitle:       seoTitle?.trim(),
      seoDescription: seoDescription?.trim(),
      status:         'published',
      source:         'mongo',
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await BlogPost.findOneAndDelete({ slug: req.params.slug, source: 'mongo' });
    if (!post) return next(new AppError('Post not found', 404));
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPost, deletePost };

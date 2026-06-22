'use strict';

const AppError = require('../utils/AppError');

function adminAuth(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return next(new AppError('Admin not configured', 503));

  const auth = req.headers['x-admin-password'];
  if (!auth || auth !== password) {
    return next(new AppError('Unauthorized', 401));
  }
  next();
}

module.exports = adminAuth;

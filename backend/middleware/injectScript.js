'use strict';

const fs   = require('fs');
const path = require('path');

const SCRIPT_TAG = '<script src="/integration.js" defer></script>';
const INJECT_BEFORE = '</head>';

// Simple in-memory cache so HTML files are not re-read on every request.
// Cleared on process restart (acceptable for dev; production uses build step).
const cache = new Map();

/**
 * Returns middleware that:
 * 1. Resolves the HTML file for the requested path
 * 2. Injects SCRIPT_TAG before </head>
 * 3. Serves the modified HTML
 * 4. Calls next() for non-HTML requests so express.static can handle them
 */
function injectScript(frontendDir) {
  return function (req, res, next) {
    // Only handle GET / HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const urlPath = req.path;

    // Resolve candidate HTML file path
    let filePath;
    if (urlPath === '/' || urlPath === '') {
      filePath = path.join(frontendDir, 'index.html');
    } else if (urlPath.endsWith('.html')) {
      filePath = path.join(frontendDir, urlPath);
    } else if (!path.extname(urlPath)) {
      // Directory-style route (e.g. /blog, /about) → look for index.html
      filePath = path.join(frontendDir, urlPath, 'index.html');
    } else {
      // Has a non-HTML extension (CSS, JS, image…) → let express.static handle it
      return next();
    }

    // Check file exists
    if (!fs.existsSync(filePath)) return next();

    // Serve from cache if available
    if (cache.has(filePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(cache.get(filePath));
    }

    // Read, inject, cache, serve
    fs.readFile(filePath, 'utf8', function (err, html) {
      if (err) return next(err);

      const injected = html.replace(INJECT_BEFORE, SCRIPT_TAG + INJECT_BEFORE);
      cache.set(filePath, injected);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(injected);
    });
  };
}

module.exports = injectScript;

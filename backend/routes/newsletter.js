'use strict';

const { Router }             = require('express');
const { subscribeNewsletter } = require('../controllers/newsletterController');

const router = Router();

router.post('/subscribe', subscribeNewsletter);

module.exports = router;

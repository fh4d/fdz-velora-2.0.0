'use strict';

const { Router } = require('express');
const { getAllMongoPosts, getSingleMongoPostBySlug } = require('../controllers/blogController');

const router = Router();

router.get('/',      getAllMongoPosts);
router.get('/:slug', getSingleMongoPostBySlug);

module.exports = router;

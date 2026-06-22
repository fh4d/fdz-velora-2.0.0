'use strict';

const { Router }        = require('express');
const { createContact } = require('../controllers/contactController');

const router = Router();

router.post('/', createContact);

module.exports = router;

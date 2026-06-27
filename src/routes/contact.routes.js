const express = require('express');
const router = express.Router();
const { submitContact, getContacts } = require('../controllers/contact.controller');

// Public - submit contact form
router.post('/contact', submitContact);

// Admin - get all contacts (you can add auth middleware later)
router.get('/contacts', getContacts);

module.exports = router;

const express = require("express");
const { createContact, getContacts } = require("../controllers/contact.controller");

const router = express.Router();

// Insert API
router.post("/", createContact);

// Get all contacts
router.get("/", getContacts);

module.exports = router;

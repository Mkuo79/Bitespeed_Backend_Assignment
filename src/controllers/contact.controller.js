const { insertContact, fetchContacts } = require("../services/contact.service");

async function createContact(req, res) {
  try {
    const { phoneNumber, email, linkedId, linkPrecedence } = req.body;

    if (!linkPrecedence || !["primary", "secondary"].includes(linkPrecedence)) {
      return res.status(400).json({ error: "Invalid linkPrecedence" });
    }

    const contact = await insertContact({ phoneNumber, email, linkedId, linkPrecedence });
    res.status(201).json({ message: "Contact created successfully", contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getContacts(req, res) {
  try {
    const contacts = await fetchContacts();
    res.status(200).json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createContact, getContacts };

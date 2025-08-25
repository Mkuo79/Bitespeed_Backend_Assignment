const { deleteCustomer } = require("../services/delete.service");

async function deleteAPI(req, res) {
  try {
    const { email, phoneNumber } = req.body;
    console.log(" Raw Input:", email);
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "At least one of email or phoneNumber is required" });
    }

    const deleteAPI = await deleteCustomer({ email, phoneNumber });
  if (deleteAPI === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { deleteAPI };

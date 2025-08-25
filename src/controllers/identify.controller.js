const { identifyCustomer } = require("../services/identify.service");

async function identify(req, res) {
  try {
    const { email, phoneNumber } = req.body;
    console.log(" Raw Input:", email);
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "At least one of email or phoneNumber is required" });
    }

    const identity = await identifyCustomer({ email, phoneNumber });
    res.json(identity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { identify };

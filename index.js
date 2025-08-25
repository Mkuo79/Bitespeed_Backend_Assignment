const express = require("express");
const contactRoutes = require("./src/routes/contact.routes");
const identifyRoutes = require("./src/routes/identify.routes");
const deleteRoutes = require("./src/routes/delete.routes");
require("dotenv").config();

const app = express();
app.use(express.json());

// Routes
app.use("/contacts", contactRoutes);
app.use("/identify", identifyRoutes);
app.use("/delete", deleteRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require("express");
const { identify } = require("../controllers/identify.controller");

const router = express.Router();

router.post("/", identify);

module.exports = router;

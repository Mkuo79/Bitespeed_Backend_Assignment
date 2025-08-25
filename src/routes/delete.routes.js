const express = require("express");
const { deleteAPI } = require("../controllers/delete.controller");

const router = express.Router();

router.post("/", deleteAPI);

module.exports = router;

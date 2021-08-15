

const express = require("express");
const router = express.Router();
const apiService = require("../services/api_service");


router.get("/suggestions", apiService.getSuggestions);


module.exports = router;

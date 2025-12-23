const express = require('express');
const router = express.Router();
const  logincont  = require('../controllers/login');

router.post('/login', logincont.login);  // ✅ POST على /api/login

module.exports = router;

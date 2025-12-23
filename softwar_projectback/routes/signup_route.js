const express = require('express');
const router = express.Router();
const authController = require('../controllers/signup');

router.post('/signup', authController.validateSignup, authController.signup);
router.post('/verify-email', authController.verifyCode)
module.exports = router;

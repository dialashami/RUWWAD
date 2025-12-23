const controller = require('../controllers/studentType');
const express = require('express');
const isAuth = require('../middleware/auth');
const router = express.Router();


router.get('/studentType', isAuth, controller.StudentType);

module.exports = router;
const express = require('express');

const router = express.Router();
const { getData } = require('../controllers/text.controller');
const {login} = require("../controllers/login");



router.post('/login' , login);



router.get('/texts', getData);




module.exports = router;
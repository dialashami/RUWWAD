const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/user_model");
const dotenv = require("dotenv");
const e = require("express");
dotenv.config();



exports.StudentType = async (req, res, next) => {

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    const studentType = user.studentType;
    res.status(200).json({ status: "success", studentType });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }

};

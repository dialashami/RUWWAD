const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/user_model");
const dotenv = require("dotenv");
const e = require("express");
dotenv.config();


exports.login = async (req, res, next) => {

const { email, password } = req.body;

try {
  // special hardcoded admin login (not stored in DB)
  if (email === "aboodjamal684@gmail.com" && password === "abd123456") {
    const token = jwt.sign(
      {
        email,
        userId: "admin",
        role: "admin",
      },
      process.env.SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      status: "success",
      token,
      userId: "admin",
    });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const error = new Error("A user with this email could not be found!");
    error.statusCode = 401;
    res.status(401).json({status:"fail", message: "user not found!" });
  }

  if (!user.isVerified) {
    return res.status(401).json({ status: "fail", message: "Email not verified. Please verify your email before logging in." });
  }

  // if (user.roles === "INSTRUCTOR" && !user.isApproved) {
  //   const error = new Error("Instructor not approved yet by admin.");
  //   error.statusCode = 403;
  //   throw error;
  // }
  if (!email || !password) {
    return res.status(400).json({ status: "fail", message: "Please provide email and password" });
  }


  const isMatch = await bcrypt.compare(password, user.password);
  // For demonstration purposes only
  if (!isMatch) {
    const error = new Error("Wrong password!");
    error.statusCode = 401;
    res.status(401).json({status:"fail", message: "Wrong password!" });
  }

  const token = jwt.sign(
    {
      email: user.email,
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.SECRET,
    { expiresIn: "1h" }
  );

  // Return full user object (without password) for frontend localStorage
  res.status(200).json({
    status: "success",
    token,
    userId: user._id.toString(),
    user: {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      studentType: user.studentType || null,
      schoolGrade: user.schoolGrade || null,
      universityMajor: user.universityMajor || null,
      trainingField: user.trainingField || null,
      isVerified: user.isVerified,
      // Teacher-specific fields
      phone: user.phone || null,
      bio: user.bio || null,
      subject: user.subject || null,
      experience: user.experience || 0,
      profileImage: user.profileImage || null,
      preferences: user.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: false
      },
    },
  });
} catch (err) {
  if (!err.statusCode) err.statusCode = 500;
  next(err);
}
};




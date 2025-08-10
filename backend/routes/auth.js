const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      userType,
      licenseNumber,
      specialization,
      experience,
      bio,
      hourlyRate,
    } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create user data
    const userData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      userType,
    }

    // Add counselor specific fields
    if (userType === "counselor") {
      userData.licenseNumber = licenseNumber
      userData.specialization = specialization
      userData.experience = experience
      userData.bio = bio
      userData.hourlyRate = hourlyRate || 100
    }

    // Create user
    const user = new User(userData)
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body

    // Find user
    const user = await User.findOne({ email, userType })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all counselors
router.get("/counselors", async (req, res) => {
  try {
    const counselors = await User.find({ userType: "counselor" }).select(
      "firstName lastName specialization avatar hourlyRate experience bio rating totalSessions availability"
    );
    res.json(counselors);
  } catch (error) {
    console.error("Get counselors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router

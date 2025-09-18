import type { Request, Response } from "express"
import { body, validationResult } from "express-validator"
import { AuthService } from "../services/authService"
import type { AuthRequest } from "../middleware/auth"

const authService = new AuthService()

// Validation rules
export const registerValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").notEmpty().withMessage("Name is required"),
  body("role").isIn(["STUDENT", "TEACHER", "ADMIN"]).withMessage("Invalid role"),
]

export const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

// Register user
export const register = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { email, password, name, role, interests, careerGoals, department } = req.body

    const result = await authService.register({
      email,
      password,
      name,
      role,
      interests,
      careerGoals,
      department,
    })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    })
  } catch (error) {
    console.error("[v0] Register error:", error)

    if (error instanceof Error && error.message === "User already exists with this email") {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    })
  }
}

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    const result = await authService.login(email, password)

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)

    if (error instanceof Error && error.message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error during login",
    })
  }
}

// Get current user
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      })
    }

    const user = await authService.getProfile(req.user.id)

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    console.error("[v0] Get me error:", error)

    if (error instanceof Error && error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

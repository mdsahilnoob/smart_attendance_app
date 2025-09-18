import { Router } from "express"
import { register, login, getMe, registerValidation, loginValidation } from "../controllers/authController"
import { protect } from "../middleware/auth"

const router = Router()

// Public routes
router.post("/register", registerValidation, register)
router.post("/login", loginValidation, login)

// Protected routes
router.get("/me", protect, getMe)

export default router

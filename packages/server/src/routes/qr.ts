import { Router } from "express"
import { generateQR, deactivateQR, getActiveQRSessions, generateQRValidation } from "../controllers/qrController"
import { protect, authorize } from "../middleware/auth"

const router = Router()

// Teacher routes
router.post("/generate", protect, authorize("TEACHER"), generateQRValidation, generateQR)
router.post("/deactivate", protect, authorize("TEACHER"), deactivateQR)
router.get("/active", protect, authorize("TEACHER"), getActiveQRSessions)

export default router

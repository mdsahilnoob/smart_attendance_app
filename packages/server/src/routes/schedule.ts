import { Router } from "express"
import { getMySchedule, getTeacherSchedule } from "../controllers/scheduleController"
import { protect, authorize } from "../middleware/auth"

const router = Router()

// Student routes
router.get("/my", protect, authorize("STUDENT"), getMySchedule)

// Teacher routes
router.get("/teacher", protect, authorize("TEACHER"), getTeacherSchedule)

export default router

import { Router } from "express"
import {
  markAttendance,
  getClassAttendance,
  getMyAttendance,
  markAttendanceValidation,
} from "../controllers/attendanceController"
import { protect, authorize } from "../middleware/auth"

const router = Router()

// Student routes
router.post("/mark-qr", protect, authorize("STUDENT"), markAttendanceValidation, markAttendance)
router.get("/my", protect, authorize("STUDENT"), getMyAttendance)

// Teacher routes
router.get("/class/:classId", protect, authorize("TEACHER"), getClassAttendance)

export default router

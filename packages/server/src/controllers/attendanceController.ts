import type { Response } from "express"
import { body, validationResult } from "express-validator"
import { AttendanceService } from "../services/attendanceService"
import type { AuthRequest } from "../middleware/auth"
import { io } from "../index"

const attendanceService = new AttendanceService()

// Validation rules
export const markAttendanceValidation = [body("qrCode").notEmpty().withMessage("QR code is required")]

// Mark attendance via QR code
export const markAttendance = async (req: AuthRequest, res: Response) => {
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

    const { qrCode } = req.body
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    const result = await attendanceService.markAttendanceByQR(studentId, qrCode)

    // Emit real-time update to class room
    const classRoom = `class_${result.class.courseCode}`
    io.to(classRoom).emit("student_marked_present", {
      studentId: result.student.id,
      studentName: result.student.user.name,
      status: result.status,
      timestamp: result.timestamp,
    })

    res.json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        status: result.status,
        timestamp: result.timestamp,
      },
    })
  } catch (error) {
    console.error("[v0] Mark attendance error:", error)

    if (error instanceof Error) {
      const statusCode = error.message.includes("Invalid or expired")
        ? 400
        : error.message.includes("not enrolled")
          ? 403
          : error.message.includes("already marked")
            ? 400
            : 500

      return res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
    })
  }
}

// Manual attendance marking (for teachers)
export const markAttendanceManually = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, timetableSlotId, status } = req.body
    const teacherId = req.user?.profileId

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const result = await attendanceService.markAttendanceManually(teacherId, studentId, timetableSlotId, status)

    res.json({
      success: true,
      message: "Attendance updated successfully",
      data: {
        status: result.status,
        method: result.method,
        timestamp: result.timestamp,
      },
    })
  } catch (error) {
    console.error("[v0] Manual attendance error:", error)

    if (error instanceof Error) {
      const statusCode = error.message.includes("Access denied") ? 403 : error.message.includes("not found") ? 404 : 500

      return res.status(statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating attendance",
    })
  }
}

// Get class attendance (for teachers)
export const getClassAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params
    const teacherId = req.user?.profileId

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const result = await attendanceService.getClassAttendance(teacherId, classId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Get class attendance error:", error)

    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
    })
  }
}

// Get student's own attendance
export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    const result = await attendanceService.getStudentAttendance(studentId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Get my attendance error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
    })
  }
}

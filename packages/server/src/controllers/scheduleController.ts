import type { Response } from "express"
import { ScheduleService } from "../services/scheduleService"
import type { AuthRequest } from "../middleware/auth"

const scheduleService = new ScheduleService()

// Get student's personal schedule
export const getMySchedule = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    const result = await scheduleService.getStudentSchedule(studentId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Get my schedule error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching schedule",
    })
  }
}

// Get teacher's schedule
export const getTeacherSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.profileId

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const result = await scheduleService.getTeacherSchedule(teacherId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("[v0] Get teacher schedule error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching schedule",
    })
  }
}

import type { Response } from "express"
import { body, validationResult } from "express-validator"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"
import crypto from "crypto"

// Validation rules
export const generateQRValidation = [
  body("classId").notEmpty().withMessage("Class ID is required"),
  body("duration").isInt({ min: 5, max: 180 }).withMessage("Duration must be between 5 and 180 minutes"),
]

// Generate QR code for attendance
export const generateQR = async (req: AuthRequest, res: Response) => {
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

    const { classId, duration = 30 } = req.body
    const teacherId = req.user?.profileId

    // Verify teacher owns this class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },
      include: {
        timetable: {
          where: {
            startTime: {
              lte: new Date(),
            },
            endTime: {
              gte: new Date(),
            },
          },
        },
      },
    })

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or access denied",
      })
    }

    if (classData.timetable.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active timetable slot found for this class",
      })
    }

    const timetableSlot = classData.timetable[0]

    // Generate unique QR code
    const qrCode = crypto.randomBytes(16).toString("hex")
    const expiresAt = new Date(Date.now() + duration * 60 * 1000)

    // Deactivate any existing QR sessions for this slot
    await prisma.qRSession.updateMany({
      where: {
        timetableSlotId: timetableSlot.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Create new QR session
    const qrSession = await prisma.qRSession.create({
      data: {
        timetableSlotId: timetableSlot.id,
        qrCode,
        expiresAt,
        isActive: true,
      },
    })

    res.json({
      success: true,
      message: "QR code generated successfully",
      data: {
        qrCode: qrSession.qrCode,
        expiresAt: qrSession.expiresAt,
        duration,
        class: {
          id: classData.id,
          courseName: classData.courseName,
          courseCode: classData.courseCode,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Generate QR error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while generating QR code",
    })
  }
}

// Deactivate QR session
export const deactivateQR = async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode } = req.body

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      })
    }

    const qrSession = await prisma.qRSession.findUnique({
      where: { qrCode },
      include: {
        timetableSlot: {
          include: {
            class: true,
          },
        },
      },
    })

    if (!qrSession) {
      return res.status(404).json({
        success: false,
        message: "QR session not found",
      })
    }

    // Verify teacher owns this class
    const teacherId = req.user?.profileId
    if (qrSession.timetableSlot.class.teacherId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Deactivate session
    await prisma.qRSession.update({
      where: { id: qrSession.id },
      data: { isActive: false },
    })

    res.json({
      success: true,
      message: "QR session deactivated successfully",
    })
  } catch (error) {
    console.error("[v0] Deactivate QR error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deactivating QR code",
    })
  }
}

// Get active QR sessions for a teacher
export const getActiveQRSessions = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.profileId

    const activeSessions = await prisma.qRSession.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
        timetableSlot: {
          class: {
            teacherId,
          },
        },
      },
      include: {
        timetableSlot: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({
      success: true,
      data: {
        sessions: activeSessions.map((session) => ({
          id: session.id,
          qrCode: session.qrCode,
          expiresAt: session.expiresAt,
          class: {
            id: session.timetableSlot.class.id,
            courseName: session.timetableSlot.class.courseName,
            courseCode: session.timetableSlot.class.courseCode,
          },
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Get active QR sessions error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching QR sessions",
    })
  }
}

import type { Response } from "express"
import { body, validationResult } from "express-validator"
import { ResourceService } from "../services/resourceService"
import type { AuthRequest } from "../middleware/auth"

const resourceService = new ResourceService()

// Validation rules
export const uploadResourceValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("classId").notEmpty().withMessage("Class ID is required"),
]

export const createLinkValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("url").isURL().withMessage("Valid URL is required"),
  body("classId").notEmpty().withMessage("Class ID is required"),
]

// Upload file resource
export const uploadResource = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const teacherId = req.user?.profileId
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const { title, description, classId } = req.body

    const resource = await resourceService.uploadResource(teacherId, classId, req.file, title, description)

    res.status(201).json({
      success: true,
      message: "Resource uploaded successfully",
      data: resource,
    })
  } catch (error) {
    console.error("[v0] Upload resource error:", error)

    if (error instanceof Error && error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while uploading resource",
    })
  }
}

// Create link resource
export const createLinkResource = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const teacherId = req.user?.profileId
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const { title, url, description, classId } = req.body

    const resource = await resourceService.createLinkResource(teacherId, classId, title, url, description)

    res.status(201).json({
      success: true,
      message: "Link resource created successfully",
      data: resource,
    })
  } catch (error) {
    console.error("[v0] Create link resource error:", error)

    if (error instanceof Error && error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating link resource",
    })
  }
}

// Get class resources
export const getClassResources = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params
    const userId = req.user?.profileId
    const userRole = req.user?.role

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: "User profile not found",
      })
    }

    const resources = await resourceService.getClassResources(classId, userId, userRole)

    res.json({
      success: true,
      data: resources,
    })
  } catch (error) {
    console.error("[v0] Get class resources error:", error)

    if (error instanceof Error && error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching resources",
    })
  }
}

// Get student's resources
export const getMyResources = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    const resources = await resourceService.getStudentResources(studentId)

    res.json({
      success: true,
      data: resources,
    })
  } catch (error) {
    console.error("[v0] Get my resources error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching resources",
    })
  }
}

// Get teacher's resources
export const getTeacherResources = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.profileId

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const resources = await resourceService.getTeacherResources(teacherId)

    res.json({
      success: true,
      data: resources,
    })
  } catch (error) {
    console.error("[v0] Get teacher resources error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching resources",
    })
  }
}

// Update resource
export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId } = req.params
    const teacherId = req.user?.profileId

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    const { title, description } = req.body
    const updates = { title, description }

    const resource = await resourceService.updateResource(resourceId, teacherId, updates)

    res.json({
      success: true,
      message: "Resource updated successfully",
      data: resource,
    })
  } catch (error) {
    console.error("[v0] Update resource error:", error)

    if (error instanceof Error && error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating resource",
    })
  }
}

// Delete resource
export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const { resourceId } = req.params
    const teacherId = req.user?.profileId

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher profile not found",
      })
    }

    await resourceService.deleteResource(resourceId, teacherId)

    res.json({
      success: true,
      message: "Resource deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete resource error:", error)

    if (error instanceof Error && error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting resource",
    })
  }
}

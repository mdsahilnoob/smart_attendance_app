import { Router } from "express"
import multer from "multer"
import { protect, authorize } from "../middleware/auth"
import {
  uploadResource,
  createLinkResource,
  getClassResources,
  getMyResources,
  getTeacherResources,
  updateResource,
  deleteResource,
  uploadResourceValidation,
  createLinkValidation,
} from "../controllers/resourceController"

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/avi",
      "video/mov",
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Teacher routes
router.post("/upload", protect, authorize("TEACHER"), upload.single("file"), uploadResourceValidation, uploadResource)
router.post("/link", protect, authorize("TEACHER"), createLinkValidation, createLinkResource)
router.get("/teacher", protect, authorize("TEACHER"), getTeacherResources)
router.put("/:resourceId", protect, authorize("TEACHER"), updateResource)
router.delete("/:resourceId", protect, authorize("TEACHER"), deleteResource)

// Student routes
router.get("/my", protect, authorize("STUDENT"), getMyResources)

// Shared routes (both teacher and student)
router.get("/class/:classId", protect, getClassResources)

export default router

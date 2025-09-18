import { Router } from "express"
import { getMySuggestions, completeActivity, getActivityHistory } from "../controllers/suggestionsController"
import { protect, authorize } from "../middleware/auth"

const router = Router()

// Student routes
router.get("/my", protect, authorize("STUDENT"), getMySuggestions)
router.post("/complete/:activityId", protect, authorize("STUDENT"), completeActivity)
router.get("/history", protect, authorize("STUDENT"), getActivityHistory)

export default router

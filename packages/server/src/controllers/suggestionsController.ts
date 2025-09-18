import type { Response } from "express"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"

// Get personalized activity suggestions for student
export const getMySuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    // Get student profile with classes
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        classes: true,
        activityHistory: {
          include: {
            activitySuggestion: true,
          },
        },
      },
    })

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      })
    }

    // Get course codes for enrolled classes
    const enrolledCourses = student.classes.map((c) => c.courseCode)

    // Get completed activity IDs
    const completedActivityIds = student.activityHistory.filter((h) => h.completedAt).map((h) => h.activitySuggestionId)

    // Find relevant activity suggestions
    const suggestions = await prisma.activitySuggestion.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: completedActivityIds, // Exclude completed activities
            },
          },
          {
            OR: [
              {
                relevantCourses: {
                  hasSome: enrolledCourses, // Activities relevant to enrolled courses
                },
              },
              {
                category: {
                  in: student.interests, // Activities matching student interests
                },
              },
            ],
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 suggestions
    })

    // Add relevance scoring
    const scoredSuggestions = suggestions.map((suggestion) => {
      let relevanceScore = 0

      // Score based on course relevance
      const courseMatches = suggestion.relevantCourses.filter((course) => enrolledCourses.includes(course)).length
      relevanceScore += courseMatches * 3

      // Score based on interest matching
      const interestMatches = student.interests.filter((interest) =>
        suggestion.category.toLowerCase().includes(interest.toLowerCase()),
      ).length
      relevanceScore += interestMatches * 2

      return {
        ...suggestion,
        relevanceScore,
      }
    })

    // Sort by relevance score
    scoredSuggestions.sort((a, b) => b.relevanceScore - a.relevanceScore)

    res.json({
      success: true,
      data: {
        suggestions: scoredSuggestions,
        totalSuggestions: scoredSuggestions.length,
        studentInterests: student.interests,
        enrolledCourses,
      },
    })
  } catch (error) {
    console.error("[v0] Get my suggestions error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching suggestions",
    })
  }
}

// Mark activity as completed
export const completeActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { activityId } = req.params
    const { timeSpent, rating } = req.body
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    // Check if activity exists
    const activity = await prisma.activitySuggestion.findUnique({
      where: { id: activityId },
    })

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      })
    }

    // Create or update activity history
    const activityHistory = await prisma.activityHistory.upsert({
      where: {
        studentId_activitySuggestionId: {
          studentId,
          activitySuggestionId: activityId,
        },
      },
      update: {
        completedAt: new Date(),
        timeSpent: timeSpent || null,
        rating: rating || null,
      },
      create: {
        studentId,
        activitySuggestionId: activityId,
        completedAt: new Date(),
        timeSpent: timeSpent || null,
        rating: rating || null,
      },
    })

    res.json({
      success: true,
      message: "Activity marked as completed",
      data: activityHistory,
    })
  } catch (error) {
    console.error("[v0] Complete activity error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while completing activity",
    })
  }
}

// Get activity history
export const getActivityHistory = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.profileId

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student profile not found",
      })
    }

    const history = await prisma.activityHistory.findMany({
      where: { studentId },
      include: {
        activitySuggestion: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    })

    const completedActivities = history.filter((h) => h.completedAt)
    const totalTimeSpent = completedActivities.reduce((sum, h) => sum + (h.timeSpent || 0), 0)
    const averageRating =
      completedActivities.length > 0
        ? completedActivities.reduce((sum, h) => sum + (h.rating || 0), 0) / completedActivities.length
        : 0

    res.json({
      success: true,
      data: {
        history,
        summary: {
          totalActivities: history.length,
          completedActivities: completedActivities.length,
          totalTimeSpent,
          averageRating: Math.round(averageRating * 100) / 100,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Get activity history error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching activity history",
    })
  }
}

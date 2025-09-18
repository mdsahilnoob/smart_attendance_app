import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma"

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    profileId?: string
  }
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid. User not found.",
      })
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileId: user.studentProfile?.id || user.teacherProfile?.id,
    }

    next()
  } catch (error) {
    console.error("[v0] Auth middleware error:", error)
    return res.status(401).json({
      success: false,
      message: "Token is not valid.",
    })
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      })
    }

    next()
  }
}

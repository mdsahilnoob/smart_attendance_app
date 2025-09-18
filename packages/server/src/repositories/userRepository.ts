import { prisma } from "../lib/prisma"
import type { Role } from "@prisma/client"

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: Role
  interests?: string[]
  careerGoals?: string
  department?: string
}

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: {
          include: {
            classes: true,
            personalGoals: true,
          },
        },
        teacherProfile: {
          include: {
            classes: true,
          },
        },
      },
    })
  }

  async create(userData: CreateUserData) {
    const { email, password, name, role, interests, careerGoals, department } = userData

    const data: any = {
      email,
      password,
      name,
      role,
    }

    if (role === "STUDENT") {
      data.studentProfile = {
        create: {
          interests: interests || [],
          careerGoals: careerGoals || "",
        },
      }
    } else if (role === "TEACHER") {
      data.teacherProfile = {
        create: {
          department: department || "",
        },
      }
    }

    return prisma.user.create({
      data,
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })
  }

  async updateProfile(userId: string, profileData: any) {
    const user = await this.findById(userId)
    if (!user) return null

    if (user.role === "STUDENT" && user.studentProfile) {
      return prisma.studentProfile.update({
        where: { id: user.studentProfile.id },
        data: profileData,
        include: {
          user: true,
        },
      })
    } else if (user.role === "TEACHER" && user.teacherProfile) {
      return prisma.teacherProfile.update({
        where: { id: user.teacherProfile.id },
        data: profileData,
        include: {
          user: true,
        },
      })
    }

    return null
  }
}

import { prisma } from "../lib/prisma"
import type { AttendanceStatus, AttendanceMethod } from "@prisma/client"

export interface CreateAttendanceData {
  studentId: string
  timetableSlotId: string
  status: AttendanceStatus
  method?: AttendanceMethod
}

export class AttendanceRepository {
  async findByStudentAndSlot(studentId: string, timetableSlotId: string) {
    return prisma.attendanceRecord.findUnique({
      where: {
        studentId_timetableSlotId: {
          studentId,
          timetableSlotId,
        },
      },
    })
  }

  async create(data: CreateAttendanceData) {
    return prisma.attendanceRecord.create({
      data,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        timetableSlot: {
          include: {
            class: true,
          },
        },
      },
    })
  }

  async findByStudentId(studentId: string) {
    return prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        timetableSlot: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    })
  }

  async findByClassId(classId: string) {
    return prisma.attendanceRecord.findMany({
      where: {
        timetableSlot: {
          classId,
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        timetableSlot: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    })
  }

  async getAttendanceStats(studentId: string) {
    const records = await this.findByStudentId(studentId)
    const totalRecords = records.length
    const presentRecords = records.filter((r) => r.status === "PRESENT").length
    const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0

    return {
      totalSessions: totalRecords,
      presentSessions: presentRecords,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    }
  }

  async updateAttendance(
    studentId: string,
    timetableSlotId: string,
    status: AttendanceStatus,
    method: AttendanceMethod,
  ) {
    return prisma.attendanceRecord.update({
      where: {
        studentId_timetableSlotId: {
          studentId,
          timetableSlotId,
        },
      },
      data: {
        status,
        method,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    })
  }
}

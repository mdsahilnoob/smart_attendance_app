import { prisma } from "../lib/prisma"

export class ClassRepository {
  async findById(id: string) {
    return prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: {
          include: {
            user: true,
            attendanceRecords: {
              include: {
                timetableSlot: true,
              },
              orderBy: {
                timestamp: "desc",
              },
            },
          },
        },
        timetable: {
          orderBy: {
            startTime: "desc",
          },
        },
        resources: true,
        performanceMetrics: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  }

  async findByTeacherId(teacherId: string) {
    return prisma.class.findMany({
      where: { teacherId },
      include: {
        students: {
          include: {
            user: true,
          },
        },
        timetable: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    })
  }

  async findByStudentId(studentId: string) {
    return prisma.class.findMany({
      where: {
        students: {
          some: {
            id: studentId,
          },
        },
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        timetable: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    })
  }

  async create(data: {
    courseName: string
    courseCode: string
    teacherId: string
  }) {
    return prisma.class.create({
      data,
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    })
  }

  async addStudentToClass(classId: string, studentId: string) {
    return prisma.class.update({
      where: { id: classId },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    })
  }

  async removeStudentFromClass(classId: string, studentId: string) {
    return prisma.class.update({
      where: { id: classId },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    })
  }
}

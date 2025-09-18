import { ClassRepository } from "../repositories/classRepository"

export class ScheduleService {
  private classRepository: ClassRepository

  constructor() {
    this.classRepository = new ClassRepository()
  }

  async getStudentSchedule(studentId: string) {
    const classes = await this.classRepository.findByStudentId(studentId)

    // Format schedule data
    const schedule = classes.flatMap((classData) =>
      classData.timetable.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        class: {
          id: classData.id,
          courseName: classData.courseName,
          courseCode: classData.courseCode,
          teacher: classData.teacher.user.name,
        },
      })),
    )

    // Group by day of week
    const scheduleByDay = schedule.reduce(
      (acc, slot) => {
        if (!acc[slot.dayOfWeek]) {
          acc[slot.dayOfWeek] = []
        }
        acc[slot.dayOfWeek].push(slot)
        return acc
      },
      {} as Record<string, any[]>,
    )

    return {
      schedule: scheduleByDay,
      totalClasses: classes.length,
      totalSessions: schedule.length,
    }
  }

  async getTeacherSchedule(teacherId: string) {
    const classes = await this.classRepository.findByTeacherId(teacherId)

    // Format schedule data
    const schedule = classes.flatMap((classData) =>
      classData.timetable.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        class: {
          id: classData.id,
          courseName: classData.courseName,
          courseCode: classData.courseCode,
          studentCount: classData.students.length,
        },
      })),
    )

    // Group by day of week
    const scheduleByDay = schedule.reduce(
      (acc, slot) => {
        if (!acc[slot.dayOfWeek]) {
          acc[slot.dayOfWeek] = []
        }
        acc[slot.dayOfWeek].push(slot)
        return acc
      },
      {} as Record<string, any[]>,
    )

    return {
      schedule: scheduleByDay,
      totalClasses: classes.length,
      totalSessions: schedule.length,
    }
  }
}

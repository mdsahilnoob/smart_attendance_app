import { AttendanceRepository } from "../repositories/attendanceRepository"
import { QRRepository } from "../repositories/qrRepository"
import { ClassRepository } from "../repositories/classRepository"
import type { AttendanceStatus } from "@prisma/client"

export class AttendanceService {
  private attendanceRepository: AttendanceRepository
  private qrRepository: QRRepository
  private classRepository: ClassRepository

  constructor() {
    this.attendanceRepository = new AttendanceRepository()
    this.qrRepository = new QRRepository()
    this.classRepository = new ClassRepository()
  }

  async markAttendanceByQR(studentId: string, qrCode: string) {
    // Find active QR session
    const qrSession = await this.qrRepository.findByCode(qrCode)

    if (!qrSession || !qrSession.isActive || qrSession.expiresAt < new Date()) {
      throw new Error("Invalid or expired QR code")
    }

    // Check if student is enrolled in this class
    const isEnrolled = qrSession.timetableSlot.class.students.some((student) => student.id === studentId)

    if (!isEnrolled) {
      throw new Error("You are not enrolled in this class")
    }

    // Check if attendance already marked
    const existingRecord = await this.attendanceRepository.findByStudentAndSlot(studentId, qrSession.timetableSlotId)

    if (existingRecord) {
      throw new Error("Attendance already marked for this session")
    }

    // Determine attendance status based on time
    const now = new Date()
    const slotStart = qrSession.timetableSlot.startTime
    const lateThreshold = new Date(slotStart.getTime() + 15 * 60000) // 15 minutes after start

    let status: AttendanceStatus = "PRESENT"
    if (now > lateThreshold) {
      status = "LATE"
    }

    // Create attendance record
    const attendanceRecord = await this.attendanceRepository.create({
      studentId,
      timetableSlotId: qrSession.timetableSlotId,
      status,
      method: "QR",
    })

    return {
      status: attendanceRecord.status,
      timestamp: attendanceRecord.timestamp,
      student: attendanceRecord.student,
      class: attendanceRecord.timetableSlot.class,
    }
  }

  async markAttendanceManually(
    teacherId: string,
    studentId: string,
    timetableSlotId: string,
    status: AttendanceStatus,
  ) {
    // Verify teacher owns this class
    const timetableSlot = await this.qrRepository.findActiveByTimetableSlot(timetableSlotId)
    if (!timetableSlot) {
      throw new Error("Timetable slot not found")
    }

    const classData = await this.classRepository.findById(timetableSlot.timetableSlot.classId)
    if (!classData || classData.teacherId !== teacherId) {
      throw new Error("Access denied: You don't own this class")
    }

    // Check if attendance already exists
    const existingRecord = await this.attendanceRepository.findByStudentAndSlot(studentId, timetableSlotId)

    if (existingRecord) {
      // Update existing record
      return this.attendanceRepository.updateAttendance(studentId, timetableSlotId, status, "MANUAL")
    } else {
      // Create new record
      return this.attendanceRepository.create({
        studentId,
        timetableSlotId,
        status,
        method: "MANUAL",
      })
    }
  }

  async getStudentAttendance(studentId: string) {
    const attendanceRecords = await this.attendanceRepository.findByStudentId(studentId)
    const stats = await this.attendanceRepository.getAttendanceStats(studentId)

    const formattedRecords = attendanceRecords.map((record) => ({
      id: record.id,
      status: record.status,
      method: record.method,
      timestamp: record.timestamp,
      class: {
        courseName: record.timetableSlot.class.courseName,
        courseCode: record.timetableSlot.class.courseCode,
      },
      session: {
        startTime: record.timetableSlot.startTime,
        endTime: record.timetableSlot.endTime,
        dayOfWeek: record.timetableSlot.dayOfWeek,
      },
    }))

    return {
      attendanceRecords: formattedRecords,
      summary: stats,
    }
  }

  async getClassAttendance(teacherId: string, classId: string) {
    // Verify teacher owns this class
    const classData = await this.classRepository.findById(classId)

    if (!classData || classData.teacherId !== teacherId) {
      throw new Error("Class not found or access denied")
    }

    // Format attendance data
    const attendanceData = classData.students.map((student) => ({
      studentId: student.id,
      studentName: student.user.name,
      studentEmail: student.user.email,
      attendanceRecords: student.attendanceRecords.map((record) => ({
        id: record.id,
        status: record.status,
        method: record.method,
        timestamp: record.timestamp,
        date: record.timetableSlot.startTime,
      })),
      attendanceRate:
        student.attendanceRecords.length > 0
          ? (student.attendanceRecords.filter((r) => r.status === "PRESENT").length /
              student.attendanceRecords.length) *
            100
          : 0,
    }))

    return {
      class: {
        id: classData.id,
        courseName: classData.courseName,
        courseCode: classData.courseCode,
      },
      students: attendanceData,
      totalSessions: classData.timetable.length,
    }
  }
}

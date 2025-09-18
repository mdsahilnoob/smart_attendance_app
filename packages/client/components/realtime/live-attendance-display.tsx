"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSocket } from "@/lib/socket"
import { apiCall } from "@/lib/auth"
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Student {
  studentId: string
  studentName: string
  studentEmail: string
  status: "PRESENT" | "ABSENT" | "LATE" | "PENDING"
  timestamp?: string
}

interface LiveAttendanceProps {
  classId: string
  courseCode: string
  courseName: string
  onClose: () => void
}

export function LiveAttendanceDisplay({ classId, courseCode, courseName, onClose }: LiveAttendanceProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [qrCode, setQrCode] = useState<string>("")
  const [sessionActive, setSessionActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const { connect, joinClassRoom, leaveClassRoom, onStudentMarkedPresent, offStudentMarkedPresent } = useSocket()

  useEffect(() => {
    const socket = connect()

    if (socket) {
      // Join the class room for real-time updates
      joinClassRoom(courseCode)

      // Listen for attendance updates
      onStudentMarkedPresent((data) => {
        console.log("[v0] Student marked present:", data)
        setStudents((prev) =>
          prev.map((student) =>
            student.studentId === data.studentId
              ? {
                  ...student,
                  status: data.status,
                  timestamp: data.timestamp,
                }
              : student,
          ),
        )
      })
    }

    // Fetch initial class data
    fetchClassData()

    return () => {
      leaveClassRoom(courseCode)
      offStudentMarkedPresent()
    }
  }, [classId, courseCode])

  const fetchClassData = async () => {
    try {
      const response = await apiCall(`/api/attendance/class/${classId}`)
      const classData = response.data

      // Initialize students with PENDING status
      const initialStudents = classData.students.map((student: any) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        status: "PENDING" as const,
      }))

      setStudents(initialStudents)
    } catch (error) {
      console.error("Failed to fetch class data:", error)
    } finally {
      setLoading(false)
    }
  }

  const startAttendanceSession = async () => {
    try {
      // Generate QR session
      const response = await apiCall("/api/qr/generate", {
        method: "POST",
        body: JSON.stringify({
          classId,
          duration: 30, // 30 minutes
        }),
      })

      setQrCode(response.data.qrCode)
      setSessionActive(true)
    } catch (error) {
      console.error("Failed to start attendance session:", error)
    }
  }

  const endAttendanceSession = async () => {
    try {
      await apiCall("/api/qr/deactivate", {
        method: "POST",
        body: JSON.stringify({ qrCode }),
      })

      setSessionActive(false)
      setQrCode("")

      // Mark remaining students as absent
      setStudents((prev) =>
        prev.map((student) => (student.status === "PENDING" ? { ...student, status: "ABSENT" as const } : student)),
      )
    } catch (error) {
      console.error("Failed to end attendance session:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "LATE":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500"
      case "LATE":
        return "bg-yellow-500"
      case "ABSENT":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const presentCount = students.filter((s) => s.status === "PRESENT").length
  const lateCount = students.filter((s) => s.status === "LATE").length
  const absentCount = students.filter((s) => s.status === "ABSENT").length
  const pendingCount = students.filter((s) => s.status === "PENDING").length

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{courseName}</h2>
          <p className="text-muted-foreground">{courseCode} - Live Attendance</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Present</p>
                <p className="text-2xl font-bold text-green-500">{presentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Late</p>
                <p className="text-2xl font-bold text-yellow-500">{lateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Absent</p>
                <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Display */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance QR Code
            </CardTitle>
            <CardDescription>Students scan this code to mark attendance</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {sessionActive ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                    QR Code: {qrCode}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Session Active</p>
                <Button variant="destructive" onClick={endAttendanceSession}>
                  End Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <p className="text-muted-foreground">No active session</p>
                </div>
                <Button onClick={startAttendanceSession}>Start Attendance Session</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
            <CardDescription>Real-time attendance status for all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {student.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {student.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(student.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(student.status)}
                      <Badge variant="outline" className={`${getStatusColor(student.status)} text-white border-none`}>
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

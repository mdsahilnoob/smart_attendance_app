"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QRGenerator } from "@/components/qr/qr-generator"
import { LiveAttendanceDisplay } from "@/components/realtime/live-attendance-display"
import { apiCall } from "@/lib/auth"
import { Calendar, Users, BookOpen, BarChart3 } from "lucide-react"

interface TeacherSchedule {
  [key: string]: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    class: {
      id: string
      courseName: string
      courseCode: string
      studentCount: number
    }
  }>
}

interface ClassAttendance {
  class: {
    id: string
    courseName: string
    courseCode: string
  }
  students: Array<{
    studentId: string
    studentName: string
    attendanceRate: number
  }>
  totalSessions: number
}

export function TeacherDashboard() {
  const [schedule, setSchedule] = useState<TeacherSchedule>({})
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [classAttendance, setClassAttendance] = useState<ClassAttendance | null>(null)
  const [showQRGenerator, setShowQRGenerator] = useState<any>(null)
  const [showLiveAttendance, setShowLiveAttendance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await apiCall("/api/schedule/teacher")
        setSchedule(response.data.schedule)
      } catch (error) {
        console.error("Failed to fetch schedule:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  const fetchClassAttendance = async (classId: string) => {
    try {
      const response = await apiCall(`/api/attendance/class/${classId}`)
      setClassAttendance(response.data)
    } catch (error) {
      console.error("Failed to fetch class attendance:", error)
    }
  }

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    return schedule[today] || []
  }

  const getAllClasses = () => {
    const classes = new Map()
    Object.values(schedule)
      .flat()
      .forEach((slot) => {
        classes.set(slot.class.id, slot.class)
      })
    return Array.from(classes.values())
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  // Show QR Generator
  if (showQRGenerator) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">QR Code Generator</h2>
            <p className="text-muted-foreground">Generate attendance QR codes for your class</p>
          </div>
          <Button variant="outline" onClick={() => setShowQRGenerator(null)}>
            Back to Dashboard
          </Button>
        </div>
        <QRGenerator
          classId={showQRGenerator.id}
          courseCode={showQRGenerator.courseCode}
          courseName={showQRGenerator.courseName}
        />
      </div>
    )
  }

  // Show Live Attendance
  if (showLiveAttendance) {
    return (
      <LiveAttendanceDisplay
        classId={showLiveAttendance.id}
        courseCode={showLiveAttendance.courseCode}
        courseName={showLiveAttendance.courseName}
        onClose={() => setShowLiveAttendance(null)}
      />
    )
  }

  const todaySchedule = getTodaySchedule()
  const allClasses = getAllClasses()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{allClasses.length}</div>
            <p className="text-xs text-muted-foreground">Classes you teach</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaySchedule.length > 0 ? "Sessions scheduled" : "No sessions today"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {allClasses.reduce((sum, cls) => sum + cls.studentCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">{slot.class.courseName}</h4>
                      <p className="text-sm text-muted-foreground">{slot.class.courseCode}</p>
                      <p className="text-sm text-muted-foreground">{slot.class.studentCount} students</p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm">
                        {new Date(slot.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => setShowQRGenerator(slot.class)} className="text-xs px-2 py-1">
                          QR Code
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowLiveAttendance(slot.class)}
                          className="text-xs px-2 py-1"
                        >
                          Live View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No classes scheduled for today</p>
            )}
          </CardContent>
        </Card>

        {/* Class Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Class Management
            </CardTitle>
            <CardDescription>Manage your classes and view attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {classAttendance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{classAttendance.class.courseName}</h4>
                  <Badge variant="outline">{classAttendance.class.courseCode}</Badge>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Student Attendance</h5>
                  {classAttendance.students.map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between p-2 border border-border rounded"
                    >
                      <span className="text-sm">{student.studentName}</span>
                      <Badge variant={student.attendanceRate >= 80 ? "default" : "destructive"}>
                        {student.attendanceRate.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full bg-transparent" onClick={() => setClassAttendance(null)}>
                  Back to Classes
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {allClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium">{cls.courseName}</h4>
                      <p className="text-sm text-muted-foreground">{cls.courseCode}</p>
                      <p className="text-sm text-muted-foreground">{cls.studentCount} students</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedClass(cls.id)
                          fetchClassAttendance(cls.id)
                        }}
                        className="text-xs px-2 py-1"
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowQRGenerator(cls)}
                        className="text-xs px-2 py-1"
                      >
                        Generate QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiCall } from "@/lib/auth"
import { Calendar, Clock, BookOpen, Target, TrendingUp, QrCode } from "lucide-react"
import Link from "next/link"

interface Schedule {
  [key: string]: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    class: {
      courseName: string
      courseCode: string
      teacher: string
    }
  }>
}

interface Suggestion {
  id: string
  title: string
  description: string
  category: string
  estimatedTime: number
  relevanceScore: number
}

interface AttendanceSummary {
  totalSessions: number
  presentSessions: number
  attendanceRate: number
}

export function StudentDashboard() {
  const [schedule, setSchedule] = useState<Schedule>({})
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, suggestionsRes, attendanceRes] = await Promise.all([
          apiCall("/api/schedule/my"),
          apiCall("/api/suggestions/my"),
          apiCall("/api/attendance/my"),
        ])

        setSchedule(scheduleRes.data.schedule)
        setSuggestions(suggestionsRes.data.suggestions)
        setAttendance(attendanceRes.data.summary)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    return schedule[today] || []
  }

  const completeActivity = async (activityId: string) => {
    try {
      await apiCall(`/api/suggestions/complete/${activityId}`, { method: "POST" })
      setSuggestions((prev) => prev.filter((s) => s.id !== activityId))
    } catch (error) {
      console.error("Failed to complete activity:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const todaySchedule = getTodaySchedule()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{attendance?.attendanceRate.toFixed(1)}%</div>
            <Progress value={attendance?.attendanceRate || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {attendance?.presentSessions} of {attendance?.totalSessions} sessions attended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">
              {todaySchedule.length > 0 ? "Classes scheduled" : "No classes today"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggested Activities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{suggestions.length}</div>
            <p className="text-xs text-muted-foreground">Personalized recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/attendance">
              <Button size="sm" className="w-full">
                Mark Attendance
              </Button>
            </Link>
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
                      <p className="text-sm text-muted-foreground">Prof. {slot.class.teacher}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {new Date(slot.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {Math.round(
                          (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60),
                        )}{" "}
                        min
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/attendance">
                  <Button className="w-full mt-4">
                    <QrCode className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No classes scheduled for today</p>
                <Link href="/attendance">
                  <Button>
                    <QrCode className="mr-2 h-4 w-4" />
                    Mark Attendance
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Suggested Activities
            </CardTitle>
            <CardDescription>Personalized recommendations for your free time</CardDescription>
          </CardHeader>
          <CardContent>
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <div key={suggestion.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{suggestion.category}</Badge>
                          <span className="text-xs text-muted-foreground">{suggestion.estimatedTime} min</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => completeActivity(suggestion.id)} className="ml-2">
                        Complete
                      </Button>
                    </div>
                  </div>
                ))}
                {suggestions.length > 3 && (
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Suggestions ({suggestions.length})
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No suggestions available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { QRScanner } from "@/components/qr/qr-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"

export function AttendancePage() {
  const { user } = useAuth()
  const [showScanner, setShowScanner] = useState(false)
  const [recentAttendance, setRecentAttendance] = useState<any[]>([])

  const handleAttendanceSuccess = (result: any) => {
    setRecentAttendance((prev) => [
      {
        id: Date.now(),
        status: result.status,
        timestamp: result.timestamp,
        class: "Current Class", // This would come from the QR code data
      },
      ...prev.slice(0, 4), // Keep only 5 recent records
    ])
    setShowScanner(false)
  }

  const handleAttendanceError = (error: string) => {
    console.error("Attendance error:", error)
  }

  if (showScanner) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setShowScanner(false)} className="mb-4">
              ← Back
            </Button>
          </div>
          <QRScanner onSuccess={handleAttendanceSuccess} onError={handleAttendanceError} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Mark your attendance for classes</p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              Mark Attendance
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                View Schedule
              </Button>
              <Button variant="outline" size="sm">
                Attendance History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        {recentAttendance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Attendance
              </CardTitle>
              <CardDescription>Your latest attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{record.class}</p>
                      <p className="text-sm text-muted-foreground">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge
                      variant={
                        record.status === "PRESENT" ? "default" : record.status === "LATE" ? "secondary" : "destructive"
                      }
                    >
                      {record.status === "PRESENT" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {record.status === "LATE" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your scheduled classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Computer Science 101</p>
                  <p className="text-sm text-muted-foreground">9:00 AM - 10:30 AM</p>
                </div>
                <Badge variant="outline">Upcoming</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Data Structures</p>
                  <p className="text-sm text-muted-foreground">2:00 PM - 3:30 PM</p>
                </div>
                <Badge variant="outline">Later</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Arrive early to ensure you can mark attendance on time</li>
              <li>• Make sure your camera is working for QR code scanning</li>
              <li>• You can also enter the QR code manually if needed</li>
              <li>• Contact your teacher if you have attendance issues</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useSocket } from "@/lib/socket"
import { useAuth } from "@/lib/auth"
import { CheckCircle, AlertCircle, Bell } from "lucide-react"

interface AttendanceNotification {
  id: string
  message: string
  type: "success" | "warning" | "info"
  timestamp: Date
}

export function AttendanceNotifications() {
  const [notifications, setNotifications] = useState<AttendanceNotification[]>([])
  const { user } = useAuth()
  const { connect, onStudentMarkedPresent, onAttendanceUpdate, offStudentMarkedPresent, offAttendanceUpdate } =
    useSocket()

  useEffect(() => {
    if (!user) return

    const socket = connect()

    if (socket) {
      // Listen for attendance updates based on user role
      if (user.role === "TEACHER") {
        onStudentMarkedPresent((data) => {
          addNotification({
            id: Date.now().toString(),
            message: `${data.studentName} marked ${data.status.toLowerCase()}`,
            type: data.status === "PRESENT" ? "success" : "warning",
            timestamp: new Date(),
          })
        })
      } else if (user.role === "STUDENT") {
        onAttendanceUpdate((data) => {
          addNotification({
            id: Date.now().toString(),
            message: `Attendance marked: ${data.status}`,
            type: data.status === "PRESENT" ? "success" : "warning",
            timestamp: new Date(),
          })
        })
      }
    }

    return () => {
      offStudentMarkedPresent()
      offAttendanceUpdate()
    }
  }, [user])

  const addNotification = (notification: AttendanceNotification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id)
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right"
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
              <p className="text-xs text-muted-foreground">{notification.timestamp.toLocaleTimeString()}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

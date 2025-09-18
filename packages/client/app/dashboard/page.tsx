"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Navbar } from "@/components/layout/navbar"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { AttendanceNotifications } from "@/components/realtime/attendance-notifications"
import { ConnectionStatus } from "@/components/realtime/connection-status"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "STUDENT":
        return <StudentDashboard />
      case "TEACHER":
        return <TeacherDashboard />
      case "ADMIN":
        return <AdminDashboard />
      default:
        return <div>Invalid user role</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{renderDashboard()}</main>

      <AttendanceNotifications />
      <ConnectionStatus />
    </div>
  )
}

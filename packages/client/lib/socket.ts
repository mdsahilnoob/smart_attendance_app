"use client"

import { io, type Socket } from "socket.io-client"
import { useAuth } from "./auth"

class SocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect() {
    const { token } = useAuth.getState()

    if (this.socket?.connected) {
      return this.socket
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    this.socket = io(API_URL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    })

    this.socket.on("connect", () => {
      console.log("[v0] Socket connected:", this.socket?.id)
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[v0] Socket disconnected:", reason)
    })

    this.socket.on("connect_error", (error) => {
      console.error("[v0] Socket connection error:", error)

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          this.socket?.connect()
        }, 1000 * this.reconnectAttempts)
      }
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  joinClassRoom(classCode: string) {
    if (this.socket?.connected) {
      this.socket.emit("join_class", classCode)
      console.log(`[v0] Joined class room: ${classCode}`)
    }
  }

  leaveClassRoom(classCode: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave_class", classCode)
      console.log(`[v0] Left class room: ${classCode}`)
    }
  }

  onStudentMarkedPresent(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("student_marked_present", callback)
    }
  }

  offStudentMarkedPresent() {
    if (this.socket) {
      this.socket.off("student_marked_present")
    }
  }

  onAttendanceUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("attendance_update", callback)
    }
  }

  offAttendanceUpdate() {
    if (this.socket) {
      this.socket.off("attendance_update")
    }
  }
}

export const socketManager = new SocketManager()

// React hook for socket connection
export const useSocket = () => {
  const { user } = useAuth()

  const connect = () => {
    if (user) {
      return socketManager.connect()
    }
    return null
  }

  const disconnect = () => {
    socketManager.disconnect()
  }

  return {
    connect,
    disconnect,
    socket: socketManager.getSocket(),
    joinClassRoom: socketManager.joinClassRoom.bind(socketManager),
    leaveClassRoom: socketManager.leaveClassRoom.bind(socketManager),
    onStudentMarkedPresent: socketManager.onStudentMarkedPresent.bind(socketManager),
    offStudentMarkedPresent: socketManager.offStudentMarkedPresent.bind(socketManager),
    onAttendanceUpdate: socketManager.onAttendanceUpdate.bind(socketManager),
    offAttendanceUpdate: socketManager.offAttendanceUpdate.bind(socketManager),
  }
}

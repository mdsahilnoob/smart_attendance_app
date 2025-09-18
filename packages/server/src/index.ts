import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
import { createServer } from "http"
import { Server } from "socket.io"
import { prisma } from "./lib/prisma"

// Import routes
import authRoutes from "./routes/auth"
import attendanceRoutes from "./routes/attendance"
import scheduleRoutes from "./routes/schedule"
import suggestionsRoutes from "./routes/suggestions"
import qrRoutes from "./routes/qr"

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

const PORT = process.env.PORT || 5000

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
})

// Middleware
app.use(helmet())
app.use(limiter)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Basic health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Smart Attendance Server is running",
    timestamp: new Date().toISOString(),
  })
})

// Database connection test
app.get("/api/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: "OK",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Database connection error:", error)
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
    })
  }
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/schedule", scheduleRoutes)
app.use("/api/suggestions", suggestionsRoutes)
app.use("/api/qr", qrRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error("[v0] Global error:", error)
  res.status(500).json({
    success: false,
    message: "Internal server error",
  })
})

// Socket.IO connection handling with authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (token) {
    // In a real app, verify JWT token here
    next()
  } else {
    next(new Error("Authentication error"))
  }
})

io.on("connection", (socket) => {
  console.log("[v0] User connected:", socket.id)

  // Join class room for real-time attendance updates
  socket.on("join_class", (classCode) => {
    const room = `class_${classCode}`
    socket.join(room)
    console.log(`[v0] User ${socket.id} joined room: ${room}`)

    // Notify room about new connection
    socket.to(room).emit("user_joined", {
      message: "A user joined the class",
      timestamp: new Date(),
    })
  })

  // Leave class room
  socket.on("leave_class", (classCode) => {
    const room = `class_${classCode}`
    socket.leave(room)
    console.log(`[v0] User ${socket.id} left room: ${room}`)

    // Notify room about user leaving
    socket.to(room).emit("user_left", {
      message: "A user left the class",
      timestamp: new Date(),
    })
  })

  // Handle attendance marking events
  socket.on("mark_attendance", (data) => {
    const room = `class_${data.classCode}`
    socket.to(room).emit("attendance_marked", {
      studentId: data.studentId,
      studentName: data.studentName,
      status: data.status,
      timestamp: new Date(),
    })
  })

  socket.on("disconnect", () => {
    console.log("[v0] User disconnected:", socket.id)
  })
})

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[v0] Shutting down gracefully...")
  await prisma.$disconnect()
  server.close(() => {
    console.log("[v0] Server closed")
    process.exit(0)
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`)
  console.log(`[v0] Environment: ${process.env.NODE_ENV}`)
  console.log(`[v0] Database URL: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`)
})

export { io }

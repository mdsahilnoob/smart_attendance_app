import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("[v0] Starting database seed...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.edu" },
    update: {},
    create: {
      email: "admin@school.edu",
      password: adminPassword,
      name: "System Administrator",
      role: "ADMIN",
    },
  })

  // Create teacher user
  const teacherPassword = await bcrypt.hash("teacher123", 12)
  const teacher = await prisma.user.upsert({
    where: { email: "john.smith@school.edu" },
    update: {},
    create: {
      email: "john.smith@school.edu",
      password: teacherPassword,
      name: "John Smith",
      role: "TEACHER",
      teacherProfile: {
        create: {
          department: "Computer Science",
        },
      },
    },
  })

  // Create student users
  const studentPassword = await bcrypt.hash("student123", 12)
  const student1 = await prisma.user.upsert({
    where: { email: "alice.johnson@student.edu" },
    update: {},
    create: {
      email: "alice.johnson@student.edu",
      password: studentPassword,
      name: "Alice Johnson",
      role: "STUDENT",
      studentProfile: {
        create: {
          interests: ["Programming", "Web Development", "AI"],
          careerGoals: "Software Engineer at a tech company",
        },
      },
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: "bob.wilson@student.edu" },
    update: {},
    create: {
      email: "bob.wilson@student.edu",
      password: studentPassword,
      name: "Bob Wilson",
      role: "STUDENT",
      studentProfile: {
        create: {
          interests: ["Database Design", "System Architecture"],
          careerGoals: "Database Administrator",
        },
      },
    },
  })

  // Get teacher profile
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacher.id },
  })

  if (!teacherProfile) {
    throw new Error("Teacher profile not found")
  }

  // Create classes
  const class1 = await prisma.class.upsert({
    where: { courseCode: "CS101" },
    update: {},
    create: {
      courseName: "Introduction to Computer Science",
      courseCode: "CS101",
      teacherId: teacherProfile.id,
    },
  })

  const class2 = await prisma.class.upsert({
    where: { courseCode: "CS201" },
    update: {},
    create: {
      courseName: "Data Structures and Algorithms",
      courseCode: "CS201",
      teacherId: teacherProfile.id,
    },
  })

  // Get student profiles
  const studentProfile1 = await prisma.studentProfile.findUnique({
    where: { userId: student1.id },
  })
  const studentProfile2 = await prisma.studentProfile.findUnique({
    where: { userId: student2.id },
  })

  if (!studentProfile1 || !studentProfile2) {
    throw new Error("Student profiles not found")
  }

  // Connect students to classes
  await prisma.class.update({
    where: { id: class1.id },
    data: {
      students: {
        connect: [{ id: studentProfile1.id }, { id: studentProfile2.id }],
      },
    },
  })

  await prisma.class.update({
    where: { id: class2.id },
    data: {
      students: {
        connect: [{ id: studentProfile1.id }],
      },
    },
  })

  // Create timetable slots
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await prisma.timetableSlot.create({
    data: {
      classId: class1.id,
      dayOfWeek: "MONDAY",
      startTime: new Date("2024-01-01T09:00:00Z"),
      endTime: new Date("2024-01-01T10:30:00Z"),
    },
  })

  await prisma.timetableSlot.create({
    data: {
      classId: class1.id,
      dayOfWeek: "WEDNESDAY",
      startTime: new Date("2024-01-01T09:00:00Z"),
      endTime: new Date("2024-01-01T10:30:00Z"),
    },
  })

  await prisma.timetableSlot.create({
    data: {
      classId: class2.id,
      dayOfWeek: "TUESDAY",
      startTime: new Date("2024-01-01T14:00:00Z"),
      endTime: new Date("2024-01-01T15:30:00Z"),
    },
  })

  // Create personal goals for students
  await prisma.personalGoal.create({
    data: {
      studentId: studentProfile1.id,
      title: "Master React Development",
      description: "Learn React hooks, context, and state management",
      deadline: new Date("2024-06-01"),
    },
  })

  await prisma.personalGoal.create({
    data: {
      studentId: studentProfile2.id,
      title: "Database Certification",
      description: "Get certified in PostgreSQL administration",
      deadline: new Date("2024-08-01"),
    },
  })

  console.log("[v0] Database seeded successfully!")
  console.log("[v0] Admin: admin@school.edu / admin123")
  console.log("[v0] Teacher: john.smith@school.edu / teacher123")
  console.log("[v0] Student 1: alice.johnson@student.edu / student123")
  console.log("[v0] Student 2: bob.wilson@student.edu / student123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

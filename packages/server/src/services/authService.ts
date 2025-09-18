import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { UserRepository, type CreateUserData } from "../repositories/userRepository"

export class AuthService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  generateToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    })
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  async register(userData: CreateUserData) {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email)
    if (existingUser) {
      throw new Error("User already exists with this email")
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password)

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    })

    // Generate token
    const token = this.generateToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.studentProfile || user.teacherProfile,
      },
      token,
    }
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new Error("Invalid credentials")
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.password)
    if (!isPasswordValid) {
      throw new Error("Invalid credentials")
    }

    // Generate token
    const token = this.generateToken(user.id)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.studentProfile || user.teacherProfile,
      },
      token,
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error("User not found")
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.studentProfile || user.teacherProfile,
    }
  }
}

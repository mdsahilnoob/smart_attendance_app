import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  id: string
  email: string
  name: string
  role: "STUDENT" | "TEACHER" | "ADMIN"
  profile?: any
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || "Login failed")
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true })
        try {
          const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || "Registration failed")
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null })
      },

      setUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)

// API helper with auth
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const { token } = useAuth.getState()

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "API call failed")
  }

  return response.json()
}

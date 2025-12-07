"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { userApi, User as UserType } from "./api/user"
import { vendorApi } from "./api/vendor"

interface User {
  id: string
  name?: string
  email: string
  username: string
  avatar?: string
}

interface Vendor {
  id: string
  name: string
  contactEmail: string
  phone: string | null
  notes: string | null
  vendorMeta?: any
  createdAt?: string
}

interface UserTypes {
  user : User;
  vendor : Vendor
}

interface AuthContextType {
  user: User | null
  vendor: Vendor | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: any) => Promise<void>
  vendorLogin: (email: string, password: string) => Promise<void>
  vendorSignup: (data: any) => Promise<void>
  logout: () => void
  logoutUser: () => void
  logoutVendor: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user_data") : null
    const storedVendor = typeof window !== "undefined" ? localStorage.getItem("vendor_data") : null
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    if (storedVendor && token) {
      setVendor(JSON.parse(storedVendor))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string ) => {
    const response = await userApi.login(email, password)
    
    setUser(response.data.user)
    localStorage.setItem("user_data", JSON.stringify(response.data.user))
    localStorage.setItem("token", response.data.token)
  }

  const signup = async (data: any) => {
    const response = await userApi.signup(data)
    
    setUser(response.data.user)
    localStorage.setItem("user_data", JSON.stringify(response.data.user))
    localStorage.setItem("token", response.data.token)
  }

  const vendorLogin = async (email: string, password: string) => {
    const response = await vendorApi.login(email, password)
    
    setVendor(response.data.vendor)
    console.log(response.data.vendor)
    localStorage.setItem("vendor_data", JSON.stringify(response.data.vendor))
    localStorage.setItem("token", response.data.token)
  }

  const vendorSignup = async (data: any) => {
    const response = await vendorApi.signup(data)
    
    setVendor(response.data.vendor)
    localStorage.setItem("vendor_data", JSON.stringify(response.data.vendor))
    localStorage.setItem("token", response.data.token)
  }

  const logout = () => {
    setUser(null)
    setVendor(null)
    localStorage.removeItem("user_data")
    localStorage.removeItem("vendor_data")
    localStorage.removeItem("token")
  }

  const logoutUser = () => {
    setUser(null)
    localStorage.removeItem("user_data")
    localStorage.removeItem("token")
  }

  const logoutVendor = () => {
    setVendor(null)
    localStorage.removeItem("vendor_data")
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, vendor, isLoading, login, signup, vendorLogin, vendorSignup, logout, logoutUser, logoutVendor }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

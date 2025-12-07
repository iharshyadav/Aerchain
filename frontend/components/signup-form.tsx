"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Eye, EyeOff, Loader2, Users, Package, Check } from "lucide-react"

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("user")
  const [error, setError] = useState("")

  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  })

  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    contactEmail: "",
    password: "",
    confirmPassword: "",
    phone: "",
    notes: "",
  })

  useEffect(() => {
    const type = searchParams.get("type")
    if (type === "vendor") {
      setActiveTab("vendor")
    }
  }, [searchParams])

  const passwordRequirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "Contains number", test: (p: string) => /\d/.test(p) },
    { label: "Contains special character (!@#$%^&*)", test: (p: string) => /[!@#$%^&*]/.test(p) },
  ]

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (userFormData.password !== userFormData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userFormData.name || undefined,
          email: userFormData.email,
          username: userFormData.username,
          password: userFormData.password,
          avatar:"https://dvudhvuhvu.com"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Signup failed")
      }

      router.push("/auth/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (vendorFormData.password !== vendorFormData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendors/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: vendorFormData.name,
          contactEmail: vendorFormData.contactEmail,
          password: vendorFormData.password,
          phone: vendorFormData.phone || undefined,
          notes: vendorFormData.notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      router.push("/auth/login?registered=true&type=vendor")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user" className="gap-2">
            <Users className="w-4 h-4" />
            User
          </TabsTrigger>
          <TabsTrigger value="vendor" className="gap-2">
            <Package className="w-4 h-4" />
            Vendor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-6">
          <form onSubmit={handleUserSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="user-name">
                Full Name <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="user-name"
                type="text"
                placeholder="John Doe"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                type="text"
                placeholder="johndoe"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">This must be unique and will be used for your profile</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-signup-email">Email</Label>
              <Input
                id="user-signup-email"
                type="email"
                placeholder="you@example.com"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="user-signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Check
                      className={`w-3 h-3 ${req.test(userFormData.password) ? "text-accent" : "text-muted-foreground"}`}
                    />
                    <span className={req.test(userFormData.password) ? "text-accent" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-confirm-password">Confirm Password</Label>
              <Input
                id="user-confirm-password"
                type="password"
                placeholder="••••••••"
                value={userFormData.confirmPassword}
                onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create User Account"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="vendor" className="mt-6">
          <form onSubmit={handleVendorSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="vendor-name">Vendor / Company Name</Label>
              <Input
                id="vendor-name"
                type="text"
                placeholder="Acme Corp"
                value={vendorFormData.name}
                onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-contact-email">Contact Email</Label>
              <Input
                id="vendor-contact-email"
                type="email"
                placeholder="vendor@company.com"
                value={vendorFormData.contactEmail}
                onChange={(e) => setVendorFormData({ ...vendorFormData, contactEmail: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">This will be used for RFP communications and login</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-phone">
                Phone <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="vendor-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={vendorFormData.phone}
                onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-notes">
                Notes / Description <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea
                id="vendor-notes"
                placeholder="Tell us about your company, products, or services..."
                value={vendorFormData.notes}
                onChange={(e) => setVendorFormData({ ...vendorFormData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="vendor-signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={vendorFormData.password}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Check
                      className={`w-3 h-3 ${req.test(vendorFormData.password) ? "text-accent" : "text-muted-foreground"}`}
                    />
                    <span className={req.test(vendorFormData.password) ? "text-accent" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-confirm-password">Confirm Password</Label>
              <Input
                id="vendor-confirm-password"
                type="password"
                placeholder="••••••••"
                value={vendorFormData.confirmPassword}
                onChange={(e) => setVendorFormData({ ...vendorFormData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering vendor...
                </>
              ) : (
                "Register as Vendor"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

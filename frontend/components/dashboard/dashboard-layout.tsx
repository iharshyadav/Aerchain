"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Users, Send, Inbox, BarChart3, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  type: "user" | "vendor"
}

const userNavItems = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/rfp/create", label: "Create RFP", icon: FileText },
  { href: "/user/rfp/list", label: "My RFPs", icon: Send },
  { href: "/user/vendors", label: "Vendors", icon: Users },
]

const vendorNavItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/rfp/inbox", label: "RFP Inbox", icon: Inbox },
  { href: "/vendor/proposals", label: "My Proposals", icon: FileText },
  { href: "/vendor/stats", label: "Statistics", icon: BarChart3 },
]

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, vendor, logoutUser, logoutVendor } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = type === "user" ? userNavItems : vendorNavItems
  const currentUser = type === "user" ? user : vendor
  const displayName = type === "user" ? user?.name || user?.username : vendor?.name

  const handleLogout = () => {
    if (type === "user") {
      logoutUser()
      router.push("/auth/login")
    } else {
      logoutVendor()
      router.push("/auth/login")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b bg-card z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-semibold text-lg">Aerchain</span>
        </div>
        <span className="text-sm text-muted-foreground">{displayName}</span>
      </header>

      <aside
        className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r z-40 transition-transform duration-300
        lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-lg">Aerchain</span>
            </Link>
          </div>

          <div className="px-6 py-4 border-b">
            <p className="text-sm text-muted-foreground">{type === "user" ? "User Account" : "Vendor Account"}</p>
            <p className="font-medium truncate">{displayName}</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

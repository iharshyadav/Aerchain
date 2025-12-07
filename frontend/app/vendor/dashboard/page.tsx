"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { vendorApi } from "@/lib/api/vendor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Inbox, FileText, BarChart3, TrendingUp, ArrowRight } from "lucide-react"

export default function VendorDashboard() {
  const router = useRouter()
  const { vendor, isLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [recentRfps, setRecentRfps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.push("/auth/login")
    }
  }, [vendor, isLoading, router])

  useEffect(() => {
    if (vendor) {
      loadDashboardData()
    }
  }, [vendor])

  const loadDashboardData = async () => {
    if (!vendor) return

    try {
      setLoading(true)
      const statsResponse = await vendorApi.getVendorStats(vendor.id)

      setStats(statsResponse.data.stats)
      setRecentRfps(statsResponse.data.stats.recentRfps || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!vendor) return null

  const statsCards = stats ? [
    { 
      label: "RFPs Received", 
      value: stats.totalRfpsSent?.toString() || "0", 
      icon: Inbox, 
      change: "" 
    },
    { 
      label: "Proposals Sent", 
      value: stats.totalProposals?.toString() || "0", 
      icon: FileText, 
      change: "" 
    },
    { 
      label: "Response Rate", 
      value: stats.responseRate || "0%", 
      icon: BarChart3, 
      change: "" 
    },
    { 
      label: "Avg. Completeness", 
      value: stats.averageCompletenessScore ? `${parseFloat(stats.averageCompletenessScore).toFixed(0)}%` : "0%", 
      icon: TrendingUp, 
      change: "" 
    },
  ] : []

  return (
    <DashboardLayout type="vendor">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-balance">Welcome back, {vendor.name}</h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your RFP activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl lg:text-3xl font-semibold mt-1">{stat.value}</p>
                    {stat.change && <p className="text-xs text-accent mt-1">{stat.change}</p>}
                  </div>
                  <div className="p-3 rounded-lg bg-secondary text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent RFP Requests</CardTitle>
              <CardDescription>RFPs waiting for your response</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendor/rfp/inbox">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRfps.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No RFPs received yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentRfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{rfp.rfp?.title || 'RFP'}</p>
                      <p className="text-sm text-muted-foreground">
                        Received: {new Date(rfp.sentAt).toLocaleDateString()} · Status: {rfp.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`
                        px-2.5 py-1 rounded-full text-xs font-medium
                        ${rfp.status === "SENT" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}
                      `}
                      >
                        {rfp.status === "SENT" ? "New" : rfp.status}
                      </span>
                      <Button size="sm" asChild>
                        <Link href={`/vendor/rfp/${rfp.id}`}>
                          {rfp.status === "SENT" ? "Respond" : "View"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

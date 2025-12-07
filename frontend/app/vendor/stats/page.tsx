"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { vendorApi } from "@/lib/api/vendor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Inbox, FileText, TrendingUp, DollarSign, Award, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VendorStatsPage() {
  const router = useRouter()
  const { vendor, isLoading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.push("/auth/login")
    }
  }, [vendor, isLoading, router])

  useEffect(() => {
    if (vendor) {
      loadStats()
    }
  }, [vendor])

  const loadStats = async () => {
    if (!vendor) return

    try {
      setLoading(true)
      const response = await vendorApi.getVendorStats(vendor.id)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
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
    { label: "Total RFPs Received", value: stats.totalRfpsSent?.toString() || "0", icon: Inbox },
    { label: "Proposals Submitted", value: stats.totalProposals?.toString() || "0", icon: FileText },
    { label: "Response Rate", value: stats.responseRate || "0%", icon: TrendingUp },
    { label: "Average Quote", value: `$${parseFloat(stats.averageProposalPrice || 0).toLocaleString()}`, icon: DollarSign },
    { label: "Avg. Completeness", value: `${parseFloat(stats.averageCompletenessScore || 0).toFixed(0)}%`, icon: Star },
  ] : []

  return (
    <DashboardLayout type="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Statistics</h1>
          <p className="text-muted-foreground mt-1">Your performance metrics and analytics</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-semibold mt-2">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats?.rfpStatusBreakdown && Object.keys(stats.rfpStatusBreakdown).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>RFP Status Breakdown</CardTitle>
              <CardDescription>Distribution of RFPs by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.rfpStatusBreakdown).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="font-medium capitalize">{status.toLowerCase()}</span>
                    <span className="text-lg font-semibold text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

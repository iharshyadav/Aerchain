"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { rfpApi, RFP } from "@/lib/api/rfp"
import { vendorApi } from "@/lib/api/vendor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, Send, Inbox, Plus, ArrowRight } from "lucide-react"

interface DashboardStats {
  activeRfps: number
  totalVendors: number
  sentRfps: number
  proposalsReceived: number
}

export default function UserDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [recentRfps, setRecentRfps] = useState<RFP[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    activeRfps: 0,
    totalVendors: 0,
    sentRfps: 0,
    proposalsReceived: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch recent RFPs
      const rfpsResponse = await rfpApi.getUserRFPs(user.id, {
        page: 1,
        limit: 3,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      setRecentRfps(rfpsResponse.data.rfps)

      // Fetch vendors
      const vendorsResponse = await vendorApi.getAllVendors({
        page: 1,
        limit: 1,
      })

      // Calculate stats from the data
      const totalSentRfps = rfpsResponse.data.rfps.reduce(
        (sum, rfp) => sum + (rfp._count?.sentRfps || 0),
        0
      )
      
      const totalProposals = rfpsResponse.data.rfps.reduce(
        (sum, rfp) => sum + (rfp._count?.proposals || 0),
        0
      )

      setStats({
        activeRfps: rfpsResponse.data.pagination.total,
        totalVendors: vendorsResponse.data.pagination.total,
        sentRfps: totalSentRfps,
        proposalsReceived: totalProposals,
      })
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

  if (!user) return null

  return (
    <DashboardLayout type="user">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-balance">Welcome back, {user.name || user.username}</h1>
            <p className="text-muted-foreground mt-1">Manage your RFPs and vendor communications</p>
          </div>
          <Button asChild>
            <Link href="/user/rfp/create">
              <Plus className="h-4 w-4 mr-2" />
              Create RFP
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent RFPs</CardTitle>
              <CardDescription>Your latest request for proposals</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user/rfp/list">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRfps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No RFPs created yet</p>
                <Button asChild className="mt-4">
                  <Link href="/user/rfp/create">Create your first RFP</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{rfp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {rfp._count?.sentRfps || 0} vendors · {rfp._count?.proposals || 0} proposals
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
                        Active
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/user/proposals?rfpId=${rfp.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push("/user/rfp/create")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Create New RFP</h3>
                <p className="text-sm text-muted-foreground">Draft and send a new request for proposal</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push("/user/vendors")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Manage Vendors</h3>
                <p className="text-sm text-muted-foreground">View and manage your vendor directory</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

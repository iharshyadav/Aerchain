"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { rfpApi, RFP } from "@/lib/api/rfp"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Users, Inbox, Calendar } from "lucide-react"

export default function RFPListPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [rfps, setRfps] = useState<RFP[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadRFPs()
    }
  }, [user])

  const loadRFPs = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await rfpApi.getUserRFPs(user.id, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      setRfps(response.data.rfps)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to load RFPs:', error)
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">My RFPs</h1>
            <p className="text-muted-foreground mt-1">View and manage all your requests for proposals</p>
          </div>
          <Button asChild>
            <Link href="/user/rfp/create">
              <Plus className="h-4 w-4 mr-2" />
              Create RFP
            </Link>
          </Button>
        </div>

        {rfps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No RFPs yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first request for proposal</p>
              <Button asChild>
                <Link href="/user/rfp/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create RFP
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rfps.map((rfp) => (
              <Card key={rfp.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-lg truncate">{rfp.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(rfp.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {rfp._count?.sentRfps || 0} vendors
                            </span>
                            <span className="flex items-center gap-1">
                              <Inbox className="h-3.5 w-3.5" />
                              {rfp._count?.proposals || 0} proposals
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {rfp.budgetUsd ? `$${Number(rfp.budgetUsd).toLocaleString()}` : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-accent text-accent-foreground"
                      >
                        Active
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/user/proposals?rfpId=${rfp.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

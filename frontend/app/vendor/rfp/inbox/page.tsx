"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { vendorApi } from "@/lib/api/vendor"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Building2, Calendar, Clock, DollarSign, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function VendorRFPInbox() {
  const router = useRouter()
  const { vendor, isLoading } = useAuth()
  const [rfps, setRfps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.push("/auth/login")
    }
  }, [vendor, isLoading, router])

  useEffect(() => {
    if (vendor) {
      loadRFPs()
    }
  }, [vendor])

  const loadRFPs = async () => {
    if (!vendor) return

    try {
      setLoading(true)
      const response = await vendorApi.getVendorRFPs(vendor.id, {
        page: 1,
        limit: 50
      })
      setRfps(response.data.rfps)
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

  if (!vendor) return null

  const filteredRfps = rfps.filter((rfp) => {
    const matchesSearch =
      rfp.rfp?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfp.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "new" && rfp.status === "SENT") ||
      (activeTab === "responded" && rfp.status === "RESPONDED")
    return matchesSearch && matchesTab
  })

  const newCount = rfps.filter((r) => r.status === "SENT").length
  const respondedCount = rfps.filter((r) => r.status === "RESPONDED").length

  return (
    <DashboardLayout type="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">RFP Inbox</h1>
          <p className="text-muted-foreground mt-1">Review and respond to incoming requests for proposals</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search RFPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({rfps.length})</TabsTrigger>
            <TabsTrigger value="new">New ({newCount})</TabsTrigger>
            <TabsTrigger value="responded">Responded ({respondedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-4">
            {filteredRfps.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No RFPs found</p>
                </CardContent>
              </Card>
            ) : (
              filteredRfps.map((rfp) => (
                <Card key={rfp.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-lg truncate">{rfp.rfp?.title || 'RFP'}</h3>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{rfp.user?.name || 'Unknown User'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{new Date(rfp.sentAt).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">Received</p>
                          </div>
                        </div>
                        {rfp.rfp?.budgetUsd && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">${Number(rfp.rfp.budgetUsd).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Budget</p>
                            </div>
                          </div>
                        )}
                        {rfp.rfp?.requirements?.metadata?.itemCount && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{rfp.rfp.requirements.metadata.itemCount} items</p>
                              <p className="text-xs text-muted-foreground">Items</p>
                            </div>
                          </div>
                        )}
                        <Badge
                          variant={
                            rfp.status === "SENT" ? "default" : rfp.status === "RESPONDED" ? "secondary" : "outline"
                          }
                          className={
                            rfp.status === "SENT"
                              ? "bg-primary"
                              : rfp.status === "RESPONDED"
                                ? "bg-accent text-accent-foreground"
                                : ""
                          }
                        >
                          {rfp.status === "SENT" ? "New" : rfp.status}
                        </Badge>
                      </div>

                      <Button asChild size="sm">
                        <Link href={`/vendor/rfp/${rfp.id}`}>
                          {rfp.status === "SENT" ? "View & Respond" : "View Details"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

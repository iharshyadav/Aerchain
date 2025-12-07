"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { vendorApi } from "@/lib/api/vendor"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Building2, DollarSign, Clock, Calendar, Eye, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function VendorProposalsPage() {
  const router = useRouter()
  const { vendor, isLoading } = useAuth()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !vendor) {
      router.push("/auth/login")
    }
  }, [vendor, isLoading, router])

  useEffect(() => {
    if (vendor) {
      loadProposals()
    }
  }, [vendor])

  const loadProposals = async () => {
    if (!vendor) return

    try {
      setLoading(true)
      const response = await vendorApi.getVendorProposals(vendor.id, {
        page: 1,
        limit: 50
      })
      setProposals(response.data.proposals)
    } catch (error) {
      console.error('Failed to load proposals:', error)
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

  return (
    <DashboardLayout type="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Proposals</h1>
          <p className="text-muted-foreground mt-1">Track the status of your submitted proposals</p>
        </div>

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
              <p className="text-muted-foreground">Your submitted proposals will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-lg truncate">{proposal.rfp?.title || 'RFP'}</h3>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>For User RFP</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{new Date(proposal.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                        </div>
                      </div>
                      {proposal.priceUsd && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">${Number(proposal.priceUsd).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Quote</p>
                          </div>
                        </div>
                      )}
                      {proposal.deliveryDays && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{proposal.deliveryDays} days</p>
                            <p className="text-xs text-muted-foreground">Delivery</p>
                          </div>
                        </div>
                      )}
                      {proposal.completenessScore && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{Math.round(proposal.completenessScore)}%</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                      )}
                      <Badge
                        variant={proposal.parsedAt ? "default" : "secondary"}
                        className={proposal.parsedAt ? "bg-accent text-accent-foreground" : ""}
                      >
                        {proposal.parsedAt ? "Processed" : "Submitted"}
                      </Badge>
                    </div>

                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
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

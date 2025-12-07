"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { rfpApi, Proposal, RFP } from "@/lib/api/rfp"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  FileText, 
  Building2, 
  DollarSign, 
  Clock, 
  Star, 
  Download, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Package,
  TrendingUp,
  Award,
  Sparkles
} from "lucide-react"

function ProposalsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rfpId = searchParams.get('rfpId')
  
  const { user, isLoading } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedRfp, setSelectedRfp] = useState<RFP | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
   console.log(proposals.length)
   console.log(selectedRfp)
  },[proposals.length,selectedRfp])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadProposals()
      if (rfpId) {
        loadRfpDetails()
      }
    }
  }, [user, rfpId, pagination.page])

  const loadRfpDetails = async () => {
    if (!rfpId) return
    
    try {
      const response = await rfpApi.getRFPById(rfpId)
      setSelectedRfp(response.data.rfp)
    } catch (error) {
      console.error('Failed to load RFP details:', error)
    }
  }

  const loadProposals = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await rfpApi.getProposalsForUser(user.id, {
        page: pagination.page,
        limit: pagination.limit,
        ...(rfpId && { rfpId }),
      })

      setProposals(response.data.proposals)
      setPagination(response.data.pagination)
      
      // Set selectedRfp from the first proposal if not already set and we have rfpId
      if (!selectedRfp && rfpId && response.data.proposals.length > 0 && response.data.proposals[0].rfp) {
        setSelectedRfp(response.data.proposals[0].rfp as RFP)
      }
    } catch (error: any) {
      console.error('Failed to load proposals:', error)
      setError(error.message || 'Failed to load proposals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setIsDialogOpen(true)
  }

  const goBackToRfps = () => {
    router.push('/user/rfp/list')
  }

  const handleCompareProposals = async () => {
    if (!rfpId) return

    try {
      setIsComparing(true)
      const response = await rfpApi.compareProposals(rfpId)
      setComparisonData(response.data)
      setProposals(response.data.rankedProposals)
      
      // Preserve selectedRfp from ranked proposals if not set
      if (!selectedRfp && response.data.rankedProposals.length > 0 && response.data.rankedProposals[0].rfp) {
        setSelectedRfp(response.data.rankedProposals[0].rfp as RFP)
      }
      
      setShowComparison(true)
    } catch (error: any) {
      console.error('Failed to compare proposals:', error)
      setError(error.message || 'Failed to compare proposals')
    } finally {
      setIsComparing(false)
    }
  }

  const handleShowAllProposals = () => {
    setShowComparison(false)
    loadProposals()
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Proposals Received</h1>
            <p className="text-muted-foreground mt-1">
              Review and compare vendor proposals for this RFP
            </p>
          </div>
          <Button variant="outline" onClick={goBackToRfps}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to RFPs
          </Button>
        </div>

        {selectedRfp && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{selectedRfp.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Budget: {selectedRfp.budgetUsd ? `$${Number(selectedRfp.budgetUsd).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {proposals.length} {proposals.length === 1 ? 'Proposal' : 'Proposals'}
                  </Badge>
                  {proposals.length > 1 && (
                    <>
                      {!showComparison ? (
                        <Button 
                          onClick={handleCompareProposals} 
                          disabled={isComparing}
                          className="gap-2"
                        >
                          {isComparing ? (
                            <>
                              <Sparkles className="h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Compare with AI
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={handleShowAllProposals}>
                          <X className="h-4 w-4 mr-2" />
                          Clear Ranking
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showComparison && comparisonData && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Recommendation
                  </h3>
                  <p className="text-muted-foreground mb-4">{comparisonData.summary.recommendation}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground mb-1">Best Vendor</p>
                      <p className="font-semibold">{comparisonData.summary.bestVendor}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground mb-1">Best Score</p>
                      <p className="font-semibold">{comparisonData.summary.bestScore}/100</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-xs text-muted-foreground mb-1">Average Price</p>
                      <p className="font-semibold">${Math.round(comparisonData.summary.averagePrice).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!rfpId ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select an RFP to view proposals</h3>
              <p className="text-muted-foreground mb-4">
                Go to your RFPs list and click "View Details" to see proposals for a specific RFP
              </p>
              <Button onClick={goBackToRfps}>
                Go to My RFPs
              </Button>
            </CardContent>
          </Card>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : proposals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
              <p className="text-muted-foreground">
                No vendors have submitted proposals for this RFP yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {proposals.map((proposal: any) => (
                <Card 
                  key={proposal.id} 
                  className={`hover:border-primary/50 transition-colors ${
                    showComparison && proposal.rank === 1 ? 'border-primary border-2' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          {showComparison && proposal.rank && (
                            <div className={`p-2 rounded-lg font-bold text-lg ${
                              proposal.rank === 1 ? 'bg-primary text-primary-foreground' :
                              proposal.rank === 2 ? 'bg-accent text-accent-foreground' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              #{proposal.rank}
                            </div>
                          )}
                          <div className="p-2 rounded-lg bg-accent/10">
                            <FileText className="h-5 w-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-lg">{proposal.rfp?.title || 'RFP'}</h3>
                              {showComparison && proposal.recommendation === 'BEST_CHOICE' && (
                                <Badge className="bg-primary gap-1">
                                  <Award className="h-3 w-3" />
                                  Best Choice
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{proposal.vendor?.name || 'Unknown Vendor'}</span>
                            </div>
                            {showComparison && proposal.rankingScore && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="h-3 w-3 text-primary" />
                                  <span className="text-sm font-semibold text-primary">Score: {proposal.rankingScore}/100</span>
                                </div>
                                {proposal.rankingReasons && proposal.rankingReasons.length > 0 && (
                                  <ul className="text-xs text-muted-foreground space-y-0.5 ml-5">
                                    {proposal.rankingReasons.map((reason: string, idx: number) => (
                                      <li key={idx}>• {reason}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">
                              {proposal.priceUsd ? `$${Number(proposal.priceUsd).toLocaleString()}` : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Price</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">
                              {proposal.deliveryDays || 'N/A'} {proposal.deliveryDays ? 'days' : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">Delivery</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">
                              {proposal.completenessScore ? `${Math.round(proposal.completenessScore)}%` : 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                        <Badge
                          variant="default"
                          className="bg-primary"
                        >
                          {proposal.parsedAt ? 'Parsed' : 'New'}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={!proposal.attachmentsMeta}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" onClick={() => handleViewProposal(proposal)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} proposals
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === pagination.page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-16rem)]! max-w-[1800px]! max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Proposal Details</DialogTitle>
            <DialogDescription>
              Comprehensive view of vendor's proposal submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="overflow-y-auto px-6 py-4">
              <div className="space-y-6 pb-6">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-5 border border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-background shadow-sm">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedProposal.vendor?.name || 'Unknown Vendor'}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{selectedProposal.vendor?.contactEmail}</p>
                      </div>
                    </div>
                    <Badge className="text-sm px-3 py-1">
                      {selectedProposal.parsedAt ? 'Processed' : 'New Submission'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-medium text-green-700 dark:text-green-300">Total Price</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {selectedProposal.priceUsd ? `$${Number(selectedProposal.priceUsd).toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Delivery Time</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {selectedProposal.deliveryDays ? `${selectedProposal.deliveryDays} days` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Completeness</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {selectedProposal.completenessScore ? `${Math.round(selectedProposal.completenessScore)}%` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Warranty Period</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {selectedProposal.warrantyMonths ? `${selectedProposal.warrantyMonths} months` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedProposal.paymentTerms && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Payment Terms
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 border">
                      <p className="text-sm leading-relaxed">{selectedProposal.paymentTerms}</p>
                    </div>
                  </div>
                )}

                {selectedProposal.lineItems && Object.keys(selectedProposal.lineItems).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Line Items Breakdown
                    </h3>
                    <div className="bg-muted/50 rounded-lg border overflow-hidden">
                      <div className="divide-y">
                        {Object.entries(selectedProposal.lineItems).map(([key, value]: [string, any], index) => (
                          <div key={key} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 hover:bg-background/50 transition-colors ${index % 2 === 0 ? 'bg-background/30' : ''}`}>
                            <span className="font-medium text-sm">{key}</span>
                            <span className="text-sm text-muted-foreground font-mono bg-background px-3 py-1 rounded border w-fit">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedProposal.rawEmailBody && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Original Email Content
                    </h3>
                    <div className="bg-muted/50 rounded-lg border p-4">
                      <div className="bg-background rounded border p-4 max-h-80 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{selectedProposal.rawEmailBody}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProposal.attachmentsMeta && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Attachments
                    </h3>
                    <div className="bg-muted/50 rounded-lg border p-4">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Download All Attachments
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Submitted On</p>
                        <p className="text-sm font-semibold mt-0.5">{new Date(selectedProposal.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedProposal.parsedAt && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Star className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Processed On</p>
                          <p className="text-sm font-semibold mt-0.5">{new Date(selectedProposal.parsedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading proposals...</div>
      </div>
    }>
      <ProposalsContent />
    </Suspense>
  )
}
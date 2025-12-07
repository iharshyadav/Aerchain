"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react"
import Link from "next/link"
import { vendorApi } from "@/lib/api/vendor"
import { useAuth } from "@/lib/auth-context"

export default function RFPDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { vendor, isLoading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rfpData, setRfpData] = useState<any>(null)
  const [proposalData, setProposalData] = useState({
    totalPrice: "",
    deliveryDays: "",
    warrantyMonths: "",
    paymentTerms: "",
    notes: "",
  })

  useEffect(() => {
    if (!authLoading && !vendor) {
      router.push("/auth/login")
    }
  }, [vendor, authLoading, router])

  useEffect(() => {
    if (vendor && params.id) {
      loadRFPDetails()
    }
  }, [vendor, params.id])

  const loadRFPDetails = async () => {
    if (!vendor) return
    
    try {
      setLoading(true)
      const response = await vendorApi.getSentRFPById(params.id as string)
      setRfpData(response.data.sentRfp)
      
      // Check if vendor has already submitted a proposal for this RFP
      const proposalsResponse = await vendorApi.getVendorProposals(vendor.id, { page: 1, limit: 100 })
      const hasSubmittedProposal = proposalsResponse.data.proposals.some(
        (proposal: any) => proposal.rfpId === response.data.sentRfp.rfpId
      )
      
      if (hasSubmittedProposal) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Failed to load RFP details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!vendor || !rfpData) return null

  const rfp = rfpData.rfp
  const items = rfp.requirements?.items || []
  const senderName = rfp.createdBy?.name || 'Unknown Buyer'
  const senderEmail = rfp.createdBy?.email || ''

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setIsSubmitting(true)

  //   await new Promise((resolve) => setTimeout(resolve, 1500))

  //   setIsSubmitting(false)
  //   setSubmitted(true)
  // }

  if (submitted) {
    return (
      <DashboardLayout type="vendor">
        <div className="max-w-3xl mx-auto">
          <Card className="border-accent/50 shadow-lg">
            <CardContent className="pt-12 pb-10 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-accent/20 to-accent/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-accent/10">
                <CheckCircle2 className="h-10 w-10 text-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                Proposal Submitted Successfully!
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                Your proposal for <span className="font-semibold text-foreground">"{rfp.title}"</span> has been sent to{" "}
                <span className="font-semibold text-foreground">{senderName}</span>.
              </p>
              
              <div className="my-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3 text-left">
                  <div className="p-2 rounded-lg bg-primary/10 mt-1">
                    <Send className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Email Notification Sent</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A detailed proposal has been sent to <span className="font-medium text-foreground">{senderEmail}</span>.
                      The buyer will review your submission and may reach out via email for further discussion or to accept your proposal.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-8">
                Please check your email inbox regularly for any responses or follow-up questions from the buyer.
              </p>

              <Separator className="my-6" />
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push("/vendor/dashboard")} size="lg" className="min-w-[180px]">
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push("/vendor/rfp/inbox")} size="lg" className="min-w-[180px]">
                  View More RFPs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout type="vendor">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vendor/rfp/inbox">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-primary">New</Badge>
            </div>
            <h1 className="text-2xl font-semibold">{rfp.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{senderName}</span>
              <span>·</span>
              <span>{senderEmail}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-1 gap-6">
           <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Send className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">How to Respond to This RFP</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p className="leading-relaxed">
                        This RFP has been sent to your registered email address. To submit your proposal:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 ml-2">
                        <li className="leading-relaxed">
                          <span className="font-medium text-foreground">Check your email inbox</span> for the detailed RFP from{" "}
                          {senderName}
                        </li>
                        <li className="leading-relaxed">
                          <span className="font-medium text-foreground">Review all requirements</span> and prepare your competitive quote
                        </li>
                        <li className="leading-relaxed">
                          <span className="font-medium text-foreground">Reply directly to the email</span> with your proposal, pricing, and
                          delivery terms
                        </li>
                      </ol>
                      <p className="leading-relaxed pt-2 text-xs border p-3 rounded-md border-red-500/30 bg-red-50 dark:bg-red-950/20">
                        <strong className="text-foreground">💡 Pro Tip:</strong> Respond promptly to increase your chances of winning the
                        contract. The buyer may have contacted multiple vendors.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Budget</span>
                  </div>
                  <p className="text-lg font-semibold">${rfp.budgetUsd ? Number(rfp.budgetUsd).toLocaleString() : 'N/A'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Delivery</span>
                  </div>
                  <p className="text-lg font-semibold">{rfp.deliveryDays || 'N/A'} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Deadline</span>
                  </div>
                  <p className="text-lg font-semibold">{rfpData.sentAt ? new Date(rfpData.sentAt).toLocaleDateString() : 'N/A'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Items</span>
                  </div>
                  <p className="text-lg font-semibold">{items.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{rfp.descriptionRaw || 'No description provided'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Items</CardTitle>
                <CardDescription>{items.length} items requested</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {item.qty} · Budget: ${item.unit_budget_usd}/unit
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        ${(item.qty * item.unit_budget_usd).toLocaleString()}
                      </p>
                    </div>
                    {Object.keys(item.specs).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(item.specs).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 rounded-md bg-secondary text-xs">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

           
          </div>

          {/* <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submit Proposal
                </CardTitle>
                <CardDescription>Provide your quote and terms</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalPrice">Total Price (USD) *</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      placeholder="45000"
                      value={proposalData.totalPrice}
                      onChange={(e) => setProposalData({ ...proposalData, totalPrice: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDays">Delivery (Days) *</Label>
                    <Input
                      id="deliveryDays"
                      type="number"
                      placeholder="14"
                      value={proposalData.deliveryDays}
                      onChange={(e) => setProposalData({ ...proposalData, deliveryDays: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warrantyMonths">Warranty (Months)</Label>
                    <Input
                      id="warrantyMonths"
                      type="number"
                      placeholder="24"
                      value={proposalData.warrantyMonths}
                      onChange={(e) => setProposalData({ ...proposalData, warrantyMonths: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      placeholder="Net 30"
                      value={proposalData.paymentTerms}
                      onChange={(e) => setProposalData({ ...proposalData, paymentTerms: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information..."
                      value={proposalData.notes}
                      onChange={(e) => setProposalData({ ...proposalData, notes: e.target.value })}
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  <Separator />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Proposal
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div> */}
        </div>
      </div>
    </DashboardLayout>
  )
}

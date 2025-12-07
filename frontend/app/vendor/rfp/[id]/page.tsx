"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

const mockRfp = {
  id: "1",
  title: "Office Supplies Q1 2025",
  senderName: "ABC Corporation",
  senderEmail: "procurement@abc.com",
  receivedAt: "2025-01-18",
  deadline: "2025-01-25",
  budgetUsd: 50000,
  deliveryDays: 30,
  paymentTerms: "Net 30",
  warrantyMonths: 24,
  items: [
    {
      name: "Ergonomic Office Chairs",
      qty: 50,
      specs: { "Lumbar Support": "Yes", "Adjustable Height": "Yes" },
      unit_budget_usd: 250,
    },
    { name: "Standing Desks", qty: 25, specs: { Width: '60"', Electric: "Yes" }, unit_budget_usd: 600 },
    { name: "4K Monitors", qty: 100, specs: { Size: '27"', "USB-C": "Yes" }, unit_budget_usd: 400 },
  ],
  descriptionRaw: `We need to procure the following items for our office expansion. Quality and timely delivery are essential.`,
}

export default function RFPDetailPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [proposalData, setProposalData] = useState({
    totalPrice: "",
    deliveryDays: "",
    warrantyMonths: "",
    paymentTerms: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <DashboardLayout type="vendor">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Proposal Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your proposal for "{mockRfp.title}" has been sent to {mockRfp.senderName}.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push("/vendor/dashboard")}>Back to Dashboard</Button>
                <Button variant="outline" onClick={() => router.push("/vendor/rfp/inbox")}>
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
            <h1 className="text-2xl font-semibold">{mockRfp.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{mockRfp.senderName}</span>
              <span>·</span>
              <span>{mockRfp.senderEmail}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Budget</span>
                  </div>
                  <p className="text-lg font-semibold">${mockRfp.budgetUsd.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Delivery</span>
                  </div>
                  <p className="text-lg font-semibold">{mockRfp.deliveryDays} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Deadline</span>
                  </div>
                  <p className="text-lg font-semibold">{new Date(mockRfp.deadline).toLocaleDateString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Items</span>
                  </div>
                  <p className="text-lg font-semibold">{mockRfp.items.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{mockRfp.descriptionRaw}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Items</CardTitle>
                <CardDescription>{mockRfp.items.length} items requested</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRfp.items.map((item, index) => (
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

          <div className="lg:col-span-1">
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

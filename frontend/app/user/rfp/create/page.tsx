"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { createRFP } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, FileText, CheckCircle2 } from "lucide-react"

interface ParsedRFP {
  title: string | null
  items: Array<{
    name: string
    qty: number | null
    specs: Record<string, unknown>
    unit_budget_usd: number | null
  }>
  total_budget_usd: number | null
  delivery_days: number | null
  payment_terms: string | null
  warranty_months: number | null
}

interface RFPResponse {
  id: string
  title: string
  referenceToken: string
  budgetUsd: number | null
  deliveryDays: number | null
  paymentTerms: string | null
  warrantyMonths: number | null
}

export default function CreateRFPPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [rfpText, setRfpText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [parsedRFP, setParsedRFP] = useState<{ rfp: RFPResponse; parsedStructure: ParsedRFP } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rfpText.trim() || !user) return

    setIsLoading(true)
    setError("")

    try {
      const response = await createRFP({ text: rfpText, userId: user.id })

      if (response.success) {
        setParsedRFP(response.data)
      } else {
        setError(response.message || "Failed to parse RFP")
      }
    } catch (err) {
      setError("An error occurred while processing your RFP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToVendors = () => {
    if (parsedRFP) {
      sessionStorage.setItem('rfpText', rfpText)
      router.push(`/user/rfp/send?rfpId=${parsedRFP.rfp.id}`)
    }
  }

  const exampleRfp = `We need to procure the following items for our office:

1. 50 units of ergonomic office chairs - budget $200-300 per unit, must have lumbar support and adjustable height
2. 25 standing desks - electric height adjustable, 60" width, budget $500-700 each
3. 100 monitors - 27" 4K resolution, USB-C connectivity, budget $350-450 each

Total budget: $50,000
Required delivery: within 30 days
Payment terms: Net 30
Warranty: minimum 2 years required`

  return (
    <DashboardLayout type="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create New RFP</h1>
          <p className="text-muted-foreground mt-1">
            Describe your requirements and our AI will structure your RFP automatically
          </p>
        </div>

        {!parsedRFP ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered RFP Parser
              </CardTitle>
              <CardDescription>
                Enter your requirements in natural language. Our AI will extract items, quantities, budgets, and terms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="rfpText">RFP Requirements</Label>
                  <Textarea
                    id="rfpText"
                    placeholder="Describe your procurement needs, including items, quantities, budget, delivery timeline, and any specific requirements..."
                    value={rfpText}
                    onChange={(e) => setRfpText(e.target.value)}
                    className="min-h-[250px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 10 characters required</p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" disabled={rfpText.length < 10 || isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Parsing RFP...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Parse with AI
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRfpText(exampleRfp)}>
                    Load Example
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Alert className="border-accent bg-accent/10">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent">
                RFP created successfully! Review the parsed details below.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {parsedRFP.parsedStructure.title || "Untitled RFP"}
                </CardTitle>
                <CardDescription>Reference: {parsedRFP.rfp.referenceToken}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-lg font-semibold">
                      {parsedRFP.parsedStructure.total_budget_usd
                        ? `$${parsedRFP.parsedStructure.total_budget_usd.toLocaleString()}`
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="text-lg font-semibold">
                      {parsedRFP.parsedStructure.delivery_days
                        ? `${parsedRFP.parsedStructure.delivery_days} days`
                        : "Not specified"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Payment Terms</p>
                    <p className="text-lg font-semibold">
                      {parsedRFP.parsedStructure.payment_terms || "Not specified"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-sm text-muted-foreground">Warranty</p>
                    <p className="text-lg font-semibold">
                      {parsedRFP.parsedStructure.warranty_months
                        ? `${parsedRFP.parsedStructure.warranty_months} months`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Items ({parsedRFP.parsedStructure.items.length})</h3>
                  <div className="space-y-3">
                    {parsedRFP.parsedStructure.items.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Qty: {item.qty || "N/A"} · Budget:{" "}
                              {item.unit_budget_usd ? `$${item.unit_budget_usd}/unit` : "N/A"}
                            </p>
                          </div>
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
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button onClick={handleSendToVendors} className="flex-1">
                    Send to Vendors
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setParsedRFP(null)
                      setRfpText("")
                    }}
                  >
                    Create Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

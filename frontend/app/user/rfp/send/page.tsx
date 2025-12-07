"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { getAllVendors, sendRFPToVendors } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, Search, Users, CheckCircle2 } from "lucide-react"

interface Vendor {
  id: string
  name: string
  contactEmail: string
  phone?: string
  _count?: {
    sentRfps: number
    proposals: number
  }
}

function SendRFPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const rfpId = searchParams.get("rfpId")

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingVendors, setIsLoadingVendors] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    const storedRfpText = sessionStorage.getItem('rfpText')
    if (storedRfpText) {
      setEmailBody(storedRfpText)
      sessionStorage.removeItem('rfpText')
    }
  }, [])

  const loadVendors = async () => {
    try {
      const response = await getAllVendors(1, 100)
      if (response.success) {
        setVendors(response.data.vendors)
      }
    } catch (err) {
      setError("Failed to load vendors")
    } finally {
      setIsLoadingVendors(false)
    }
  }

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors((prev) => (prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]))
  }

  const selectAll = () => {
    setSelectedVendors(filteredVendors.map((v) => v.id))
  }

  const deselectAll = () => {
    setSelectedVendors([])
  }

  const handleSend = async () => {
    if (!rfpId || selectedVendors.length === 0 || !emailSubject.trim()) {
      setError("Please select vendors and provide an email subject")
      return
    }

    setIsSending(true)
    setError("")

    try {
      const response = await sendRFPToVendors({
        vendorIds: selectedVendors,
        rfpId,
        subject: emailSubject,
        text: emailBody,
        senderName: user?.name || user?.username,
        senderEmail: user?.email,
      })

      if (response.success) {
        setSuccess(true)
      } else {
        setError(response.message || "Failed to send RFP")
      }
    } catch (err) {
      setError("An error occurred while sending")
    } finally {
      setIsSending(false)
    }
  }

  if (success) {
    return (
      <DashboardLayout type="user">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">RFP Sent Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your RFP has been sent to {selectedVendors.length} vendor{selectedVendors.length > 1 ? "s" : ""}. You
                will receive proposals via email.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push("/user/dashboard")}>Back to Dashboard</Button>
                <Button variant="outline" onClick={() => router.push("/user/rfp/create")}>
                  Create Another RFP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout type="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Send RFP to Vendors</h1>
          <p className="text-muted-foreground mt-1">Select vendors and customize your email message</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Vendors
              </CardTitle>
              <CardDescription>
                {selectedVendors.length} of {vendors.length} selected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>

              {isLoadingVendors ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading vendors...
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredVendors.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No vendors found</p>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <label
                        key={vendor.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                          ${selectedVendors.includes(vendor.id) ? "border-primary bg-primary/5" : "hover:bg-secondary"}
                        `}
                      >
                        <Checkbox
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={() => toggleVendor(vendor.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{vendor.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{vendor.contactEmail}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Email Message
              </CardTitle>
              <CardDescription>Customize the email that will be sent to vendors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  className={emailSubject.trim() ? "" : "border-red-400 border"}
                  id="subject"
                  placeholder="Please enter the subject for your proporsal"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body</Label>
                <Textarea
                  id="body"
                  placeholder="Add any additional message or instructions for vendors..."
                  value={emailBody}
                  disabled
                  // onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSend}
                disabled={selectedVendors.length === 0 || !emailSubject.trim() || isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedVendors.length} Vendor{selectedVendors.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function SendRFPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SendRFPContent />
    </Suspense>
  )
}
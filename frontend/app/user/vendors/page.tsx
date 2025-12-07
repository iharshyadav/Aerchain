"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { getAllVendors } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Mail, Phone, FileText, Inbox } from "lucide-react"

interface Vendor {
  id: string
  name: string
  contactEmail: string
  phone?: string
  notes?: string
  _count?: {
    sentRfps: number
    proposals: number
  }
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadVendors()
  }, [page, searchQuery])

  const loadVendors = async () => {
    setIsLoading(true)
    try {
      const response = await getAllVendors(page, 10, searchQuery)
      if (response.success) {
        setVendors(response.data.vendors)
        setTotalPages(response.data.pagination.totalPages)
      }
    } catch (err) {
      console.error("Failed to load vendors")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout type="user">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Vendor Directory</h1>
            <p className="text-muted-foreground mt-1">Manage and browse your vendor network</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No vendors found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg truncate">{vendor.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{vendor.contactEmail}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {vendor.phone}
                    </div>
                  )}

                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor._count?.sentRfps || 0} RFPs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Inbox className="h-4 w-4 text-muted-foreground" />
                      <span>{vendor._count?.proposals || 0} Proposals</span>
                    </div>
                  </div>

                  {vendor.notes && <p className="text-sm text-muted-foreground line-clamp-2">{vendor.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

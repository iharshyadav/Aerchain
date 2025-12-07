import { API_BASE_URL } from './config'
import { getAuthToken } from '../auth-context'

export interface Vendor {
  id: string
  name: string
  contactEmail: string
  phone: string | null
  notes: string | null
  vendorMeta: any
  createdAt: string
  _count?: {
    sentRfps: number
    proposals: number
  }
}

export interface VendorListResponse {
  success: boolean
  data: {
    vendors: Vendor[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface VendorStats {
  success: boolean
  data: {
    vendorId: string
    vendorName: string
    stats: {
      totalRfpsSent: number
      rfpStatusBreakdown: Record<string, number>
      totalProposals: number
      averageProposalPrice: string
      averageCompletenessScore: string
      responseRate: string
    }
  }
}

export const vendorApi = {
  async login(email: string, password: string): Promise<{
    success: boolean
    data: {
      vendor: Vendor
      token: string
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/api/vendors/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contactEmail: email, password }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to login')
    }
    
    return response.json()
  },

  async signup(data: {
    name: string
    contactEmail: string
    password: string
    phone?: string
    notes?: string
    vendorMeta?: any
  }): Promise<{
    success: boolean
    data: {
      vendor: Vendor
      token: string
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/api/vendors/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to signup')
    }
    
    return response.json()
  },

  async getAllVendors(params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<VendorListResponse> {
    const queryParams = new URLSearchParams({
      page: params?.page?.toString() || '1',
      limit: params?.limit?.toString() || '10',
      ...(params?.search && { search: params.search }),
    })

    const response = await fetch(
      `${API_BASE_URL}/api/vendors?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch vendors')
    }
    
    return response.json()
  },

  async getVendorById(id: string): Promise<{ success: boolean; data: Vendor }> {
    const response = await fetch(`${API_BASE_URL}/api/vendors/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch vendor')
    }
    
    return response.json()
  },

  async getVendorStats(id: string): Promise<VendorStats> {
    const response = await fetch(`${API_BASE_URL}/api/vendors/${id}/stats`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch vendor stats')
    }
    
    return response.json()
  },

  async createVendor(data: {
    name: string
    contactEmail: string
    password: string
    phone?: string
    notes?: string
    vendorMeta?: any
  }): Promise<{ success: boolean; data: Vendor }> {
    const response = await fetch(`${API_BASE_URL}/api/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create vendor')
    }
    
    return response.json()
  },

  async getVendorRFPs(vendorId: string, params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<{
    success: boolean
    data: {
      rfps: any[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }
  }> {
    const queryParams = new URLSearchParams({
      page: params?.page?.toString() || '1',
      limit: params?.limit?.toString() || '20',
      ...(params?.status && { status: params.status }),
    })

    const response = await fetch(
      `${API_BASE_URL}/api/vendors/${vendorId}/rfps?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch vendor RFPs')
    }
    
    return response.json()
  },

  async getVendorProposals(vendorId: string, params?: {
    page?: number
    limit?: number
  }): Promise<{
    success: boolean
    data: {
      proposals: any[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }
  }> {
    const queryParams = new URLSearchParams({
      page: params?.page?.toString() || '1',
      limit: params?.limit?.toString() || '20',
    })

    const response = await fetch(
      `${API_BASE_URL}/api/vendors/${vendorId}/proposals?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch vendor proposals')
    }
    
    return response.json()
  },
}

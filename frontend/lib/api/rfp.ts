import { API_BASE_URL } from './config'
import { getAuthToken } from '../auth-context'

export interface RFPItem {
  name: string
  qty: number | null
  specs: Record<string, any>
  unit_budget_usd: number | null
}

export interface RFP {
  id: string
  title: string
  descriptionRaw: string
  requirements: {
    items: RFPItem[]
    metadata: {
      parsedAt: string
      itemCount: number
    }
  }
  budgetUsd: number | null
  deliveryDays: number | null
  paymentTerms: string | null
  warrantyMonths: number | null
  referenceToken: string
  createdAt: string
  _count?: {
    sentRfps: number
    proposals: number
  }
}

export interface CreateRFPData {
  text: string
  userId: string
}

export interface RFPListResponse {
  success: boolean
  data: {
    rfps: RFP[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface Proposal {
  id: string
  rfpId: string
  vendorId: string
  priceUsd: number | null
  lineItems: any
  deliveryDays: number | null
  warrantyMonths: number | null
  paymentTerms: string | null
  completenessScore: number | null
  parsedAt: string | null
  rawEmailBody: string | null
  attachmentsMeta: any
  sentRfpReference: string | null
  createdAt: string
  rfp?: {
    id: string
    title: string
  }
  vendor?: {
    id: string
    name: string
    contactEmail: string
  }
}

export interface ProposalListResponse {
  success: boolean
  data: {
    proposals: Proposal[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type")
  
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Server returned ${response.status}. Expected JSON but got ${contentType}`)
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`)
  }
  
  return data
}

export const rfpApi = {
  async createRFP(data: CreateRFPData): Promise<{ success: boolean; data: { rfp: RFP } }> {
    const response = await fetch(`${API_BASE_URL}/api/users/userRfpRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create RFP')
    }
    
    return response.json()
  },

  async getUserRFPs(userId: string, params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<RFPListResponse> {
    const queryParams = new URLSearchParams({
      page: params?.page?.toString() || '1',
      limit: params?.limit?.toString() || '20',
      sortBy: params?.sortBy || 'createdAt',
      sortOrder: params?.sortOrder || 'desc',
    })

    const response = await fetch(
      `${API_BASE_URL}/api/users/rfps/${userId}?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch RFPs')
    }
    
    return response.json()
  },

   async getRFPById(rfpId: string): Promise<{ success: boolean; data: { rfp: RFP } }> {
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/proposals/rfp/${rfpId}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })
    
    return handleResponse(response)
  },

   async getProposalsForUser(userId: string, params?: {
    page?: number
    limit?: number
    rfpId?: string
  }): Promise<ProposalListResponse> {
    const token = getAuthToken()
    
    const queryParams = new URLSearchParams({
      page: params?.page?.toString() || '1',
      limit: params?.limit?.toString() || '50',
      ...(params?.rfpId && { rfpId: params.rfpId }),
    })

    const response = await fetch(
      `${API_BASE_URL}/api/proposals/user/${userId}?${queryParams}`,
      {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    )
    
    return handleResponse(response)
  },
  
}

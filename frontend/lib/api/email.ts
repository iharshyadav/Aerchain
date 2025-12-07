import { API_BASE_URL } from './config'
import { getAuthToken } from '../auth-context'

export interface SendEmailData {
  to: string
  subject: string
  text?: string
  html?: string
  rfpId?: string
  vendorId?: string
  senderName?: string
  senderEmail?: string
}

export interface SendMultipleEmailsData {
  vendorIds: string[]
  rfpId?: string
  subject: string
  text?: string
  html?: string
  senderName?: string
  senderEmail?: string
}

export const emailApi = {
  async sendEmail(data: SendEmailData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send email')
    }
    
    return response.json()
  },

  async sendToMultipleVendors(data: SendMultipleEmailsData): Promise<{
    success: boolean
    message: string
    data: {
      sent: any[]
      failed: any[]
      summary: {
        total: number
        successful: number
        failed: number
      }
    }
  }> {
    const response = await fetch(`${API_BASE_URL}/api/email/send-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send emails')
    }
    
    return response.json()
  },
}

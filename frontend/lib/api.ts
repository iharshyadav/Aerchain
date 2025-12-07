const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

// Auth token management
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(`token`)
  }
  return null
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`token`)
  }
}

// User API
export async function userSignup(data: { name?: string; username: string; email: string; password: string }) {
  const res = await fetch(`${API_URL}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function userLogin(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

// Vendor API
export async function vendorSignup(data: {
  name: string
  contactEmail: string
  password: string
  phone?: string
  notes?: string
}) {
  const res = await fetch(`${API_URL}/api/vendors/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function vendorLogin(data: { contactEmail: string; password: string }) {
  const res = await fetch(`${API_URL}/api/vendors/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.json()
}

// RFP API
export async function createRFP(data: { text: string; userId: string }) {
  const res = await fetch(`${API_URL}/api/users/userRfpRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function sendRFPToVendors(data: {
  vendorIds: string[]
  rfpId: string
  subject: string
  text?: string
  html?: string
  senderName?: string
  senderEmail?: string
}) {
  const res = await fetch(`${API_URL}/api/email/send-multiple`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(data),
  })
  return res.json()
}

// Vendor Management API
export async function getAllVendors(page = 1, limit = 10, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), search })
  const res = await fetch(`${API_URL}/api/vendors?${params}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })
  return res.json()
}

export async function getVendorById(id: string) {
  const res = await fetch(`${API_URL}/api/vendors/${id}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })
  return res.json()
}

export async function getVendorStats(id: string) {
  const res = await fetch(`${API_URL}/api/vendors/${id}/stats`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })
  return res.json()
}

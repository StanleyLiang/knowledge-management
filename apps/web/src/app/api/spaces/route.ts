import { NextRequest, NextResponse } from 'next/server'

import { API_BASE_URL } from '@/lib/config'

export async function GET() {
  const res = await fetch(`${API_BASE_URL}/spaces`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const res = await fetch(`${API_BASE_URL}/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

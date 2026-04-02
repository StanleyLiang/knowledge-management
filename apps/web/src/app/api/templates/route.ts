import { NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

export async function GET() {
  const res = await fetch(`${API_BASE_URL}/templates`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || ''
  const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(q)}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

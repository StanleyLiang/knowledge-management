import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString()
  const res = await fetch(`${API_BASE_URL}/syntheses${qs ? `?${qs}` : ''}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

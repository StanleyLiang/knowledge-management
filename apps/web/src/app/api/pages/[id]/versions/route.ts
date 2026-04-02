import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await fetch(`${API_BASE_URL}/pages/${id}/versions`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

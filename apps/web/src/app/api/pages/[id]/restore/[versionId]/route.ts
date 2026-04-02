import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/config'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params
  const res = await fetch(`${API_BASE_URL}/pages/${id}/restore/${versionId}`, { method: 'POST' })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

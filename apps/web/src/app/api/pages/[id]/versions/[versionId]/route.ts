import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params
  const res = await fetch(`${API_URL}/api/pages/${id}/versions/${versionId}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

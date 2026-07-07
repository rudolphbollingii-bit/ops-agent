import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db.from('domains').select('*').order('sort_order')
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

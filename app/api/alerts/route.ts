import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('alerts')
    .select('*, domain:domains(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('alerts').insert(body).select().single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { ids, read } = await req.json()
  const { error } = await db.from('alerts').update({ read: read ?? true }).in('id', ids)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

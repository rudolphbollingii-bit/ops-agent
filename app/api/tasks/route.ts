import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('tasks')
    .select('*, domain:domains(*)')
    .order('priority')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('tasks').insert(body).select('*, domain:domains(*)').single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, ...updates } = await req.json()
  const { data, error } = await db.from('tasks').update(updates).eq('id', id).select('*, domain:domains(*)').single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

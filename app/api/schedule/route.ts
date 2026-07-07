import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const { data, error } = await db
    .from('schedule_blocks')
    .select('*, domain:domains(*)')
    .eq('date', date)
    .order('start_time')
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('schedule_blocks').insert(body).select('*, domain:domains(*)').single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data: block } = await db.from('schedule_blocks').select('protected').eq('id', id).single()
  if (block?.protected) return NextResponse.json({ error: 'Cannot delete a protected block' }, { status: 403 })
  const { error } = await db.from('schedule_blocks').delete().eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

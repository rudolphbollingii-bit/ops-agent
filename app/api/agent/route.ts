import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase'
import { buildSystemPrompt } from '@/lib/agent-context'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const db = createServiceClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      { data: tasks },
      { data: alerts },
      { data: blocks },
      { data: domains },
    ] = await Promise.all([
      db.from('tasks').select('*, domain:domains(*)').eq('status', 'open').order('priority'),
      db.from('alerts').select('*, domain:domains(*)').eq('read', false).order('created_at', { ascending: false }),
      db.from('schedule_blocks').select('*, domain:domains(*)').eq('date', today).order('start_time'),
      db.from('domains').select('*').order('sort_order'),
    ])

    const systemPrompt = buildSystemPrompt(tasks || [], alerts || [], blocks || [], domains || [])

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Something went wrong.'

    // Save to DB for history
    await db.from('conversations').insert({
      messages: [...messages, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }]
    })

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Agent error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

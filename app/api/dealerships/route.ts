import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const { data, error } = await supabase
    .from('dealerships')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const body = await req.json()
  
  const { data, error } = await supabase
    .from('dealerships')
    .insert(body)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  
  const { data, error } = await supabase
    .from('dealerships')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  let supabase
  try {
    supabase = createServiceClient()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Configuration error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
  const { id } = await req.json()
  
  const { error } = await supabase
    .from('dealerships')
    .delete()
    .eq('id', id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

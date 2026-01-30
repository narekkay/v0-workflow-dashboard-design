import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const redirectUrl = new URL('/login', request.url)
  return NextResponse.redirect(redirectUrl)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const redirectUrl = new URL('/login', request.url)
  return NextResponse.redirect(redirectUrl)
}

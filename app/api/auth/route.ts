import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const defaultPassword = 'VQ2026_@Abcd'
    const configuredPassword = (process.env.DASHBOARD_PASSWORD || '').trim()
    const validPasswords = new Set([defaultPassword, configuredPassword].filter(Boolean))

    if (!validPasswords.has(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('vq_auth', password, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('vq_auth')
  return response
}

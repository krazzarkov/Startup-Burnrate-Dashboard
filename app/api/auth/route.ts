import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password === process.env.DASHBOARD_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('auth', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    return NextResponse.json({ authenticated: true })
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get('auth')?.value === 'true'
  return NextResponse.json({ authenticated: isAuthenticated })
}


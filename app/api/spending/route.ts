import { NextResponse } from 'next/server'
import { getSpending, addSpending } from '@/lib/db'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json([])
  }

  try {
    const spending = await getSpending()
    return NextResponse.json(spending)
  } catch (error) {
    console.error('Error fetching spending:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json({ success: true })
  }

  try {
    const { amount, date, is_advanced } = await request.json()
    if (!amount || !date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    await addSpending(parseFloat(amount), date, is_advanced)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding spending:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


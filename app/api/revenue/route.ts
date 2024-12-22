import { NextResponse } from 'next/server'
import { getRevenue, addRevenue } from '@/lib/db'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json([])
  }

  try {
    const revenue = await getRevenue()
    return NextResponse.json(revenue)
  } catch (error) {
    console.error('Error fetching revenue:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json({ success: true })
  }

  try {
    const { amount, date } = await request.json()
    if (!amount || !date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    await addRevenue(parseFloat(amount), date)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding revenue:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


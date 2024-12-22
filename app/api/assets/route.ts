import { NextResponse } from 'next/server'
import { getAssets, addAsset } from '@/lib/db'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json([])
  }

  try {
    const assets = await getAssets()
    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json({ success: true })
  }

  try {
    const { name, amount, date, note, category } = await request.json()
    if (!name || !amount || !date || !category) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 })
    }
    await addAsset(name, parseFloat(amount), date, note, category)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding asset:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


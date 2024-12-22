import { NextResponse } from 'next/server'
import { getAssetCategories, addAssetCategory } from '@/lib/db'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json([])
  }

  try {
    const categories = await getAssetCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching asset categories:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json({ success: true })
  }

  try {
    const { name, color } = await request.json()
    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }
    await addAssetCategory(name, color)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding asset category:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


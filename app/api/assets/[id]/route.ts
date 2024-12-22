import { NextRequest, NextResponse } from 'next/server'
import { deleteAsset, updateAsset } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await deleteAsset(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { name, amount, date, note, category } = await request.json()
    if (!name || !amount || !date || !category) {
      return NextResponse.json({ error: 'All required fields must be filled' }, { status: 400 })
    }
    await updateAsset(id, name, parseFloat(amount), date, note, category)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating asset:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


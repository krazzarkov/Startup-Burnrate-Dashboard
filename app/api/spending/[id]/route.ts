import { NextResponse } from 'next/server'
import { deleteSpending, updateSpending } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await deleteSpending(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting spending:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { amount, date, is_advanced } = await request.json()
    if (!amount || !date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    await updateSpending(id, parseFloat(amount), date, is_advanced)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating spending:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


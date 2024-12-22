import { NextResponse } from 'next/server'
import { deleteRevenue, updateRevenue } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await deleteRevenue(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting revenue:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { amount, date } = await request.json()
    if (!amount || !date) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    await updateRevenue(id, parseFloat(amount), date)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating revenue:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


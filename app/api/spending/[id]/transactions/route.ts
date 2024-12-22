import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 2] // get ID from the URL

    if (!id) {
      return NextResponse.json({ error: 'Missing spending ID' }, { status: 400 })
    }

    const spendingId = parseInt(id)
    if (isNaN(spendingId)) {
      return NextResponse.json({ error: 'Invalid spending ID' }, { status: 400 })
    }

    const transactions = await getTransactions(spendingId)
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


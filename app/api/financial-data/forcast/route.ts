import { NextResponse } from 'next/server'
import { getFinancialData } from '@/lib/db'

export async function GET() {
  try {
    const financialData = await getFinancialData()
    return NextResponse.json(financialData)
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


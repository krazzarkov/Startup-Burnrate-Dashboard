import { NextResponse } from 'next/server'
import { getFinancialData } from '@/lib/db'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DOCKER_BUILD === 'true') {
    return NextResponse.json({ message: 'Data not available during build' })
  }

  try {
    const financialData = await getFinancialData()
    return NextResponse.json(financialData)
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


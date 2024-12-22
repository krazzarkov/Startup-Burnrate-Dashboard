import { NextResponse } from 'next/server'
import { addSpending, addTransaction } from '@/lib/db'
import { parse } from 'csv-parse/sync'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const date = formData.get('date') as string

  if (!file || !date) {
    return NextResponse.json({ error: 'File and date are required' }, { status: 400 })
  }

  const fileContent = await file.text()
  const records = parse(fileContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true 
  }).filter((record: { Amount: string }) => record.Amount && record.Amount.trim() !== '')

  let totalAmount = 0
  const transactions = []

  for (const record of records) {
    const cleanAmount = record.Amount.replace(/[$,]/g, "").trim()
    const amount = parseFloat(cleanAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: `Invalid amount found in CSV: ${record.Amount}` }, { status: 400 })
    }
    totalAmount += amount
    const formattedDate = formatDate(record.Date)
    if (formattedDate) {
      transactions.push({
        paymentType: record['Payment Type'],
        amount,
        date: formattedDate,
        invoiceReceipt: record['Invoice/Receipt']
      })
    }
  }

  if (totalAmount === 0) {
    return NextResponse.json({ error: 'Total amount cannot be zero' }, { status: 400 })
  }

  const result = await addSpending(totalAmount, date, true)
  const spendingId = result.lastID

  for (const transaction of transactions) {
    await addTransaction(spendingId, transaction.paymentType, transaction.amount, transaction.date, transaction.invoiceReceipt)
  }

  return NextResponse.json({ success: true, spendingId, totalAmount })
}

function formatDate(dateString: string): string | undefined {
  if (!dateString.trim()) {
    return undefined
  }

  // check if the date is already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // handle MM/DD/YYYY format
  const parts = dateString.split('/')
  if (parts.length === 3) {
    const [month, day, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // not recognized, return undefined
  return undefined
}


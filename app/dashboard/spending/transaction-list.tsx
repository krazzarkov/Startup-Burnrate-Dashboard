'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface Transaction {
  id: number
  payment_type: string
  amount: number
  date: string
  invoice_receipt: string | null
}

export function TransactionList({ spendingId }: { spendingId: number }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [spendingId])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/spending/${spendingId}/transactions`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTransactions(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to fetch transactions. Please try again later.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Payment Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Invoice/Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{transaction.payment_type}</TableCell>
            <TableCell>${transaction.amount.toFixed(2)}</TableCell>
            <TableCell>{formatDate(transaction.date)}</TableCell>
            <TableCell>
              {transaction.invoice_receipt ? (
                transaction.invoice_receipt.startsWith('http') ? (
                  <Button
                    variant="link"
                    onClick={() => window.open(transaction.invoice_receipt!, '_blank')}
                  >
                    View
                  </Button>
                ) : (
                  transaction.invoice_receipt
                )
              ) : (
                'N/A'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}


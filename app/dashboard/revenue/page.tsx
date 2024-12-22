'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/app/components/DashboardLayout'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Revenue {
  id: number
  amount: number
  date: string
}

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<Revenue[]>([])
  const [newRevenue, setNewRevenue] = useState({ amount: '', date: '' })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    fetchRevenue()
  }, [])

  const fetchRevenue = async () => {
    try {
      const response = await fetch('/api/revenue')
      if (!response.ok) {
        throw new Error('Failed to fetch revenue')
      }
      const data = await response.json()
      setRevenue(data)
    } catch (error) {
      console.error('Error fetching revenue:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRevenue.amount || !newRevenue.date) {
      alert("Please fill in both amount and date.")
      return
    }
    try {
      const selectedDate = new Date(newRevenue.date + '-01')
      const formattedDate = selectedDate.toISOString().slice(0, 7) // format as YYYY-MM
      const response = await fetch(editingId ? `/api/revenue/${editingId}` : '/api/revenue', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRevenue, date: formattedDate }),
      })

      if (!response.ok) {
        throw new Error('Failed to save revenue')
      }

      setNewRevenue({ amount: '', date: '' })
      setEditingId(null)
      fetchRevenue()
    } catch (error) {
      console.error('Error saving revenue:', error)
      alert('Failed to save revenue. Please try again.')
    }
  }

  const handleEdit = (item: Revenue) => {
    setNewRevenue({ 
      amount: item.amount.toString(), 
      date: item.date
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/revenue/${id}`, { method: 'DELETE' })
    fetchRevenue()
  }

  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Monthly Revenue</h1>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            type="number"
            value={newRevenue.amount}
            onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
            placeholder="Amount"
            className="flex-1"
            required
          />
          <Input
            type="month"
            value={newRevenue.date}
            onChange={(e) => setNewRevenue({ ...newRevenue, date: e.target.value })}
            className="flex-1"
            required
          />
        </div>
        <Button type="submit">{editingId ? 'Update' : 'Add'} Revenue</Button>
      </form>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenue.map((item) => (
              <TableRow key={item.id}>
                <TableCell>${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(item)} className="mr-2 mb-2 md:mb-0">Edit</Button>
                  <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/app/components/DashboardLayout'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TransactionList } from './transaction-list'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog"

interface Spending {
  id: number
  amount: number
  date: string
  is_advanced: number 
}

export default function SpendingPage() {
  const [spending, setSpending] = useState<Spending[]>([])
  const [newSpending, setNewSpending] = useState({ amount: '', date: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isAdvanced, setIsAdvanced] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedSpendingId, setSelectedSpendingId] = useState<number | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null })

  useEffect(() => {
    fetchSpending()
  }, [])

  const fetchSpending = async () => {
    try {
      const response = await fetch('/api/spending')
      if (!response.ok) {
        throw new Error('Failed to fetch spending')
      }
      const data = await response.json()
      setSpending(data)
    } catch (error) {
      console.error('Error fetching spending:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newSpending.amount && !isAdvanced) || !newSpending.date) {
      alert("Please fill in all required fields.")
      return
    }
    const selectedDate = new Date(newSpending.date + '-01')
    if (selectedDate > new Date()) {
      alert("Cannot add spending for future dates.")
      return
    }

    try {
      if (isAdvanced && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('date', newSpending.date)

        const response = await fetch('/api/spending/upload-csv', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload CSV')
        }

        // upload was successful, refresh the data and reset the form
        await fetchSpending()
        setNewSpending({ amount: '', date: '' })
        setEditingId(null)
        setIsAdvanced(false)
        setFile(null)
        return // don't proceed with "Simple" spending submission
      } else {
        const formattedDate = selectedDate.toISOString().slice(0, 7) // format as YYYY-MM
        const response = await fetch(editingId ? `/api/spending/${editingId}` : '/api/spending', {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(newSpending.amount),
            date: formattedDate,
            is_advanced: isAdvanced ? 1 : 0 
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save spending')
        }

        setNewSpending({ amount: '', date: '' })
        setEditingId(null)
        setIsAdvanced(false)
        setFile(null)
        fetchSpending()
      }
    } catch (error) {
      console.error('Error saving spending:', error)
      alert(error instanceof Error ? error.message : 'Failed to save spending. Please try again.')
    }
  }

  const handleEdit = (item: Spending) => {
    setNewSpending({
      amount: item.amount.toString(),
      date: item.date
    })
    setEditingId(item.id)
    setIsAdvanced(item.is_advanced === 1)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/spending/${id}`, { method: 'DELETE' })
    fetchSpending()
  }

  const formatDate = (dateString: string) => {
    const [year, month] = dateString.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Monthly Spending</h1>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="advanced-mode"
            checked={isAdvanced}
            onCheckedChange={setIsAdvanced}
          />
          <Label htmlFor="advanced-mode">Advanced Mode</Label>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {!isAdvanced && (
            <Input
              type="number"
              value={newSpending.amount}
              onChange={(e) => setNewSpending({ ...newSpending, amount: e.target.value })}
              placeholder="Amount"
              className="flex-1"
              required={!isAdvanced}
            />
          )}
          <Input
            type="month"
            value={newSpending.date}
            onChange={(e) => setNewSpending({ ...newSpending, date: e.target.value })}
            className="flex-1"
            required
            max={new Date().toISOString().slice(0, 7)}
          />
        </div>
        {isAdvanced && (
          <Input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            required={isAdvanced}
          />
        )}
        <Button type="submit">{editingId ? 'Update' : 'Add'} Spending</Button>
      </form>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spending.map((item) => (
              <TableRow key={item.id}>
                <TableCell>${item.amount.toFixed(2)}</TableCell>
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>{item.is_advanced === 1 ? 'Advanced' : 'Simple'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleEdit(item)}>Edit</Button>
                    <Button variant="destructive" onClick={() => setDeleteConfirmation({ isOpen: true, id: item.id })}>Delete</Button>
                    {item.is_advanced === 1 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedSpendingId(item.id)}>View Transactions</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Transactions for {formatDate(item.date)}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-[calc(80vh-100px)]">
                            {selectedSpendingId && <TransactionList spendingId={selectedSpendingId} />}
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(isOpen) => setDeleteConfirmation({ isOpen, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this spending entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the spending entry and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteConfirmation.id) {
                handleDelete(deleteConfirmation.id)
                setDeleteConfirmation({ isOpen: false, id: null })
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}


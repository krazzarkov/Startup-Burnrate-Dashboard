'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/app/components/DashboardLayout'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

interface Asset {
  id: number
  name: string
  amount: number
  date: string
  note: string
  category: string
}

interface Category {
  id: number
  name: string
  color: string
}

function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [newAsset, setNewAsset] = useState({ name: '', amount: '', date: '', note: '', category: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', color: '#000000' })
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  useEffect(() => {
    fetchAssets()
    fetchCategories()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      const data = await response.json()
      setAssets(data)
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/asset-categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAsset.name || !newAsset.amount || !newAsset.date || !newAsset.category) {
      alert("Please fill in all required fields.")
      return
    }
    try {
      const response = await fetch(editingId ? `/api/assets/${editingId}` : '/api/assets', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      })
      if (!response.ok) {
        throw new Error('Failed to save asset')
      }
      setNewAsset({ name: '', amount: '', date: '', note: '', category: '' })
      setEditingId(null)
      fetchAssets()
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to save asset. Please try again.')
    }
  }

  const handleEdit = (asset: Asset) => {
    setNewAsset({ name: asset.name, amount: asset.amount.toString(), date: asset.date, note: asset.note, category: asset.category })
    setEditingId(asset.id)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    fetchAssets()
  }

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.color) {
      alert("Please provide a name and color for the new category.")
      return
    }
    await fetch('/api/asset-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategory),
    })
    setNewCategory({ name: '', color: '#000000' })
    setIsAddingCategory(false)
    fetchCategories()
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Assets</h1>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            value={newAsset.name}
            onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
            placeholder="Asset name"
            className="flex-1"
            required
          />
          <Input
            type="number"
            value={newAsset.amount}
            onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
            placeholder="Amount"
            className="flex-1"
            required
          />
          <Input
            type="date"
            value={newAsset.date}
            onChange={(e) => setNewAsset({ ...newAsset, date: e.target.value })}
            className="flex-1"
            required
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Select
            value={newAsset.category}
            onValueChange={(value) => {
              if (value === 'new') {
                setIsAddingCategory(true)
              } else {
                setNewAsset({ ...newAsset, category: value })
              }
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                    {category.name}
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="new">+ Add new category</SelectItem>
            </SelectContent>
          </Select>
          <Popover open={isAddingCategory} onOpenChange={setIsAddingCategory}>
            <PopoverTrigger asChild>
              <Button type="button">Add Category</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Add New Category</h4>
                  <p className="text-sm text-muted-foreground">
                    Create a new category for your assets.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
                <Button type="button" onClick={handleAddCategory}>Add Category</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Textarea
          value={newAsset.note}
          onChange={(e) => setNewAsset({ ...newAsset, note: e.target.value })}
          placeholder="Add a note (optional)"
        />
        <Button type="submit">{editingId ? 'Update' : 'Add'} Asset</Button>
      </form>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>${asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell>{new Date(asset.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: categories.find(c => c.name === asset.category)?.color || '#000000' }}
                    ></div>
                    {asset.category}
                  </div>
                </TableCell>
                <TableCell>{asset.note}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(asset)} className="mr-2 mb-2 md:mb-0">Edit</Button>
                  <Button variant="destructive" onClick={() => handleDelete(asset.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  )
}

export default AssetsPage


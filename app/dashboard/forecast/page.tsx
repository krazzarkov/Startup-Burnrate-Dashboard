'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, addMonths, parseISO, differenceInMonths } from 'date-fns'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { withAuth } from '@/app/components/withAuth'
import { DashboardLayout } from '@/app/components/DashboardLayout'

interface PredictedExpense {
  id: string
  name: string
  amount: number
  startDate: string
  endDate: string
  isAveraged: boolean
}

interface FinancialData {
  date: string
  assets: number
  spending: number
  revenue: number
}

function ForecastPage() {
  const [predictedExpenses, setPredictedExpenses] = useState<PredictedExpense[]>([])
  const [newExpense, setNewExpense] = useState<PredictedExpense>({
    id: '',
    name: '',
    amount: 0,
    startDate: '',
    endDate: '',
    isAveraged: false
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [avgMonthlySpend, setAvgMonthlySpend] = useState(0)
  const [remainingAssets, setRemainingAssets] = useState(0)
  const [originalRunway, setOriginalRunway] = useState(0)

  useEffect(() => {
    fetchFinancialData()
    loadPredictedExpenses()
  }, [])

  const fetchFinancialData = async () => {
    try {
      const response = await fetch('/api/financial-data')
      const { financialData, avgMonthlySpend, remainingAssets, runway } = await response.json()
      setFinancialData(financialData || [])
      setAvgMonthlySpend(avgMonthlySpend || 0)
      setRemainingAssets(remainingAssets || 0)
      setOriginalRunway(runway || 0)
    } catch (error) {
      console.error('Error fetching financial data:', error)
      // default values in case of an error
      setFinancialData([])
      setAvgMonthlySpend(0)
      setRemainingAssets(0)
      setOriginalRunway(0)
    }
  }

  const loadPredictedExpenses = () => {
    const saved = localStorage.getItem('predictedExpenses')
    if (saved) {
      setPredictedExpenses(JSON.parse(saved))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedExpenses = editingId
      ? predictedExpenses.map(expense => 
          expense.id === editingId ? { ...newExpense, id: editingId } : expense
        )
      : [...predictedExpenses, { ...newExpense, id: Date.now().toString() }]
    
    setPredictedExpenses(updatedExpenses)
    savePredictedExpenses(updatedExpenses)
    setNewExpense({ id: '', name: '', amount: 0, startDate: '', endDate: '', isAveraged: false })
    setEditingId(null)
  }

  const handleEdit = (expense: PredictedExpense) => {
    setNewExpense(expense)
    setEditingId(expense.id)
  }

  const handleDelete = (id: string) => {
    const updatedExpenses = predictedExpenses.filter(expense => expense.id !== id)
    setPredictedExpenses(updatedExpenses)
    savePredictedExpenses(updatedExpenses)
  }

  const savePredictedExpenses = (expenses: PredictedExpense[]) => {
    localStorage.setItem('predictedExpenses', JSON.stringify(expenses))
  }

  const generateForecastData = useMemo(() => {
    if (financialData.length === 0) return []

    const lastActualDate = parseISO(financialData[financialData.length - 1].date)
    let currentDate = addMonths(lastActualDate, 1)
    let currentAssets = remainingAssets
    let monthsCount = 0

    const forecastData = [...financialData]

    while (currentAssets > 0 && monthsCount < 120) { // limit to 120 months to prevent infinite loop
      const monthDate = format(currentDate, 'yyyy-MM')
      let monthlySpending = avgMonthlySpend

      predictedExpenses.forEach(expense => {
        if (expense.startDate <= monthDate && expense.endDate >= monthDate) {
          if (expense.isAveraged) {
            const expenseMonths = differenceInMonths(parseISO(expense.endDate), parseISO(expense.startDate)) + 1
            monthlySpending += expense.amount / expenseMonths
          } else {
            monthlySpending += expense.amount
          }
        }
      })

      currentAssets -= monthlySpending

      forecastData.push({
        date: monthDate,
        assets: Math.max(currentAssets, 0),
        spending: monthlySpending,
        revenue: 0
      })

      currentDate = addMonths(currentDate, 1)
      monthsCount++
    }

    return forecastData
  }, [financialData, predictedExpenses, avgMonthlySpend, remainingAssets])

  const calculatePredictedRunway = useMemo(() => {
    if (predictedExpenses.length === 0 || remainingAssets === null || avgMonthlySpend === null) return null;

    let currentAssets = remainingAssets;
    let monthsCount = 0;
    const sortedExpenses = [...predictedExpenses].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const startDate = parseISO(sortedExpenses[0].startDate);

    while (currentAssets > 0 && monthsCount < 120) {
      const currentDate = addMonths(startDate, monthsCount);
      const monthDate = format(currentDate, 'yyyy-MM');
      let monthlySpending = avgMonthlySpend;

      sortedExpenses.forEach(expense => {
        if (expense.startDate <= monthDate && expense.endDate >= monthDate) {
          if (expense.isAveraged) {
            const expenseMonths = differenceInMonths(parseISO(expense.endDate), parseISO(expense.startDate)) + 1;
            monthlySpending += expense.amount / expenseMonths;
          } else {
            monthlySpending += expense.amount;
          }
        }
      });

      currentAssets -= monthlySpending;
      monthsCount++;

      if (currentAssets <= 0) break;
    }

    return monthsCount;
  }, [predictedExpenses, remainingAssets, avgMonthlySpend, originalRunway]);

  const runwayDifference = useMemo(() => {
    if (predictedExpenses.length === 0 || calculatePredictedRunway === null || originalRunway === null) return null;

    const monthsDifference = calculatePredictedRunway - originalRunway;
    const percentageDifference = (monthsDifference / originalRunway) * 100;

    return {
      months: monthsDifference,
      percentage: percentageDifference
    };
  }, [calculatePredictedRunway, originalRunway, predictedExpenses]);

  const calculateRunwayEndDate = (runway: number | null) => {
    if (runway === null || runway === Infinity || financialData.length === 0) return 'N/A';
    const lastDate = new Date(financialData[financialData.length - 1].date + '-01');
    const endDate = addMonths(lastDate, Math.floor(runway));
    return format(endDate, 'MMM yyyy');
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Forecast</h1>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            type="text"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            placeholder="Expense name"
            className="flex-1"
            required
          />
          <Input
            type="number"
            value={newExpense.amount || ''}
            onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
            placeholder="Amount"
            className="flex-1"
            required
          />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            type="month"
            value={newExpense.startDate}
            onChange={(e) => setNewExpense({ ...newExpense, startDate: e.target.value })}
            className="flex-1"
            required
          />
          <Input
            type="month"
            value={newExpense.endDate}
            onChange={(e) => setNewExpense({ ...newExpense, endDate: e.target.value })}
            className="flex-1"
            required
          />
        </div>
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="average-expense"
            checked={newExpense.isAveraged}
            onCheckedChange={(checked) => setNewExpense({ ...newExpense, isAveraged: checked })}
          />
          <Label htmlFor="average-expense">Average expense over period</Label>
        </div>
        <Button type="submit">{editingId ? 'Update' : 'Add'} Predicted Expense</Button>
      </form>

      <div className="overflow-x-auto mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Averaged</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {predictedExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.name}</TableCell>
                <TableCell>${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell>{format(parseISO(expense.startDate), 'MMMM yyyy')}</TableCell>
                <TableCell>{format(parseISO(expense.endDate), 'MMMM yyyy')}</TableCell>
                <TableCell>{expense.isAveraged ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(expense)} className="mr-2 mb-2 md:mb-0">Edit</Button>
                  <Button variant="destructive" onClick={() => handleDelete(expense.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {generateForecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateForecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="assets" stroke="#8884d8" name="Assets" />
                  <Line type="monotone" dataKey="spending" stroke="#82ca9d" name="Spending" />
                  <Line type="monotone" dataKey="revenue" stroke="#ffc658" name="Revenue" />
                  {predictedExpenses.map((expense) => (
                    <ReferenceLine
                      key={expense.id}
                      x={expense.startDate}
                      stroke="black"
                      strokeWidth={1}
                      label={{ value: expense.name, position: 'top' }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Runway Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-lg">
              Original Runway: <span className="font-bold">{originalRunway !== null ? `${originalRunway.toFixed(1)} months` : 'N/A'}</span>
              <span className="text-sm text-gray-500 ml-2">
                (Ends: {calculateRunwayEndDate(originalRunway)})
              </span>
            </p>
            {predictedExpenses.length > 0 && calculatePredictedRunway !== null && (
              <>
                <p className="text-lg">
                  Predicted Runway: <span className="font-bold">{calculatePredictedRunway.toFixed(1)} months</span>
                  <span className="text-sm text-gray-500 ml-2">
                    (Ends: {calculateRunwayEndDate(calculatePredictedRunway)})
                  </span>
                </p>
                {runwayDifference && (
                  <p className="text-lg">
                    Difference: <span className={`font-bold ${runwayDifference.months >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {runwayDifference.months >= 0 ? '+' : ''}{runwayDifference.months.toFixed(1)} months ({Math.abs(runwayDifference.percentage).toFixed(2)}%)
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

export default withAuth(ForecastPage)


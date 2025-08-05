'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/app/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'
import { format, addMonths } from 'date-fns'

interface FinancialData {
  date: string
  assets: number
  spending: number
  revenue: number
  rollingAvgSpend?: number
  newAssets?: {
    amount: number
    category: string
    color: string
  }[]
}

interface AssetCategory {
  id: number
  name: string
  color: string
}

export default function StatisticsPage() {
  const [data, setData] = useState<FinancialData[]>([])
  const [totalBurnt, setTotalBurnt] = useState<number | null>(null)
  const [totalBurntChange, setTotalBurntChange] = useState<number | null>(null)
  const [runway, setRunway] = useState<number | null>(null)
  const [runwayChange, setRunwayChange] = useState<number | null>(null)
  const [avgMonthlySpend, setAvgMonthlySpend] = useState<number | null>(null)
  const [avgMonthlySpendChange, setAvgMonthlySpendChange] = useState<number | null>(null)
  const [remainingAssets, setRemainingAssets] = useState<number | null>(null)
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [visibleSeries, setVisibleSeries] = useState({
    assets: true,
    spending: true,
    revenue: true,
    avgMonthlySpend: true
  })

  useEffect(() => {
    fetchData()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/asset-categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const categoriesData = await response.json()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const calculateRollingAverage = (financialData: FinancialData[]) => {
    return financialData.map((entry, index) => {
      const monthsWithSpending = financialData.slice(0, index + 1).filter(month => month.spending > 0)
      const totalSpending = monthsWithSpending.reduce((sum, month) => sum + month.spending, 0)
      const rollingAvg = monthsWithSpending.length > 0 ? totalSpending / monthsWithSpending.length : 0
      
      return {
        ...entry,
        rollingAvgSpend: rollingAvg
      }
    })
  }

  const fetchData = async () => {
    try {
      const response = await fetch('/api/financial-data')
      if (!response.ok) {
        throw new Error('Failed to fetch financial data')
      }
      const { financialData, avgMonthlySpend, remainingAssets, runway } = await response.json()
      
      const dataWithRollingAvg = calculateRollingAverage(financialData)
      setData(dataWithRollingAvg)
      setRemainingAssets(remainingAssets)

      if (dataWithRollingAvg.length > 1) {
        const currentMonth = dataWithRollingAvg[dataWithRollingAvg.length - 1]
        const previousMonth = dataWithRollingAvg[dataWithRollingAvg.length - 2]

        // total burnt
        const totalSpending = dataWithRollingAvg.reduce((sum, month) => sum + month.spending, 0)
        const totalRevenue = dataWithRollingAvg.reduce((sum, month) => sum + month.revenue, 0)
        const currentTotalBurnt = Math.max(0, totalSpending - totalRevenue)
        
        // previous total burnt (excluding current month)
        const previousTotalSpending = dataWithRollingAvg.slice(0, -1).reduce((sum, month) => sum + month.spending, 0)
        const previousTotalRevenue = dataWithRollingAvg.slice(0, -1).reduce((sum, month) => sum + month.revenue, 0)
        const previousTotalBurnt = Math.max(0, previousTotalSpending - previousTotalRevenue)
        
        setTotalBurnt(currentTotalBurnt)

        const totalBurntChangePercent = previousTotalBurnt !== 0 ? ((currentTotalBurnt - previousTotalBurnt) / previousTotalBurnt) * 100 : 0
        setTotalBurntChange(totalBurntChangePercent)

        setRunway(runway)

        const previousRunway = avgMonthlySpend > 0 ? previousMonth.assets / avgMonthlySpend : Infinity
        const runwayChangePercent = previousRunway !== Infinity ? ((runway - previousRunway) / previousRunway) * 100 : 0
        setRunwayChange(runwayChangePercent)

        setAvgMonthlySpend(avgMonthlySpend)
        const avgMonthlySpendChangePercent = previousMonth.spending !== 0 ? ((avgMonthlySpend - previousMonth.spending) / previousMonth.spending) * 100 : 0
        setAvgMonthlySpendChange(avgMonthlySpendChangePercent)
      } else {
        // set default values if we don't have enough data
        setTotalBurnt(null)
        setTotalBurntChange(null)
        setRunway(null)
        setRunwayChange(null)
        setAvgMonthlySpend(null)
        setAvgMonthlySpendChange(null)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
      // set all values to null in case of an error
      setTotalBurnt(null)
      setTotalBurntChange(null)
      setRunway(null)
      setRunwayChange(null)
      setAvgMonthlySpend(null)
      setAvgMonthlySpendChange(null)
      setRemainingAssets(null)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-black p-4 border rounded shadow">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ))}
          {data.find(item => item.date === label)?.newAssets && (
            <div className="mt-2">
              <p className="font-bold">New Assets:</p>
              {data.find(item => item.date === label)?.newAssets?.map((asset, index) => (
                <p key={index} style={{ color: asset.color }}>
                  {asset.category}: ${asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const PercentageIndicator = ({ value, metric }: { value: number | null, metric: 'totalBurnt' | 'runway' | 'avgMonthlySpend' }) => {
    if (value === null) return null;

    const Icon = value >= 0 ? ArrowUpIcon : ArrowDownIcon
    let color = 'text-gray-500'

    switch (metric) {
      case 'totalBurnt':
      case 'avgMonthlySpend':
        color = value >= 0 ? 'text-red-500' : 'text-green-500'
        break
      case 'runway':
        color = value >= 0 ? 'text-green-500' : 'text-red-500'
        break
    }

    return (
      <span className={`flex items-center ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {Math.abs(value).toFixed(2)}%
      </span>
    )
  }

  const calculateRunwayEndDate = () => {
    if (runway === null || runway === Infinity || data.length === 0) return 'N/A'
    const lastDate = new Date(data[data.length - 1].date + '-01')
    const endDate = addMonths(lastDate, Math.floor(runway))
    return format(endDate, 'MMM yyyy')
  }

  const toggleSeries = (series: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [series]: !prev[series]
    }))
  }

  const SeriesToggle = ({ series, label, color }: { series: keyof typeof visibleSeries, label: string, color: string }) => (
    <button
      onClick={() => toggleSeries(series)}
      className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        visibleSeries[series]
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
      {label}
    </button>
  )

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Runway</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {runway === null ? 'N/A' : runway === Infinity ? 'Infinite' : `${runway.toFixed(1)} months`}
                </p>
                <p className="text-sm text-gray-500">
                  Ends: {calculateRunwayEndDate()}
                </p>
              </div>
              {runway !== null && runway !== Infinity && <PercentageIndicator value={runwayChange} metric="runway" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Monthly Burn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {avgMonthlySpend !== null ? `$${avgMonthlySpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
              </p>
              <PercentageIndicator value={avgMonthlySpendChange} metric="avgMonthlySpend" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Burnt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {totalBurnt !== null ? `$${totalBurnt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
              </p>
              <PercentageIndicator value={totalBurntChange} metric="totalBurnt" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remaining Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {remainingAssets !== null ? `$${remainingAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <SeriesToggle series="assets" label="Assets" color="#8884d8" />
            <SeriesToggle series="spending" label="Spending" color="#82ca9d" />
            <SeriesToggle series="revenue" label="Revenue" color="#ffc658" />
            <SeriesToggle series="avgMonthlySpend" label="Avg Monthly Spend" color="red" />
          </div>
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {visibleSeries.assets && (
                  <Line type="monotone" dataKey="assets" stroke="#8884d8" name="Assets" />
                )}
                {visibleSeries.spending && (
                  <Line type="monotone" dataKey="spending" stroke="#82ca9d" name="Spending" />
                )}
                {visibleSeries.revenue && (
                  <Line type="monotone" dataKey="revenue" stroke="#ffc658" name="Revenue" />
                )}
                {visibleSeries.avgMonthlySpend && (
                  <Line type="monotone" dataKey="rollingAvgSpend" stroke="red" strokeDasharray="3 3" name="Avg Monthly Spend" />
                )}
                {data.map((entry, index) => 
                  entry.newAssets && entry.newAssets.map((asset, assetIndex) => (
                    <ReferenceLine
                      key={`${index}-${assetIndex}`}
                      x={entry.date}
                      stroke={asset.color}
                      strokeWidth={2}
                      label={{ value: '', position: 'top' }}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}


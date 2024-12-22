'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Menu, Home, DollarSign, TrendingUp, BarChart2, LineChart } from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from './theme-toggle'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground md:flex-row">
      <button
        className="md:hidden p-4 text-foreground focus:outline-none"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>
      <aside className={`w-full md:w-64 bg-card text-card-foreground p-6 ${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <nav className="space-y-2">
          <Link href="/dashboard/statistics">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/assets">
            <Button variant="ghost" className="w-full justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Assets
            </Button>
          </Link>
          <Link href="/dashboard/spending">
            <Button variant="ghost" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Spending
            </Button>
          </Link>
          <Link href="/dashboard/revenue">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart2 className="mr-2 h-4 w-4" />
              Revenue
            </Button>
          </Link>
          <Link href="/dashboard/forecast">
            <Button variant="ghost" className="w-full justify-start">
              <LineChart className="mr-2 h-4 w-4" />
              Forecast
            </Button>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {children}
      </main>
    </div>
  )
}


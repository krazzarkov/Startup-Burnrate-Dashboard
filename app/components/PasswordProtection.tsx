'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PasswordProtectionProps {
  children: React.ReactNode
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const response = await fetch('/api/auth')
    const data = await response.json()
    setIsAuthenticated(data.authenticated)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (response.ok) {
      setIsAuthenticated(true)
    } else {
      setError('Incorrect password')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-4 text-2xl font-bold">Enter Password</h2>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4"
          placeholder="Enter password"
        />
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <Button type="submit">Submit</Button>
      </form>
    </div>
  )
}


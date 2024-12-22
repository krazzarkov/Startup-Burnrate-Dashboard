'use client'

import { useEffect, useState } from 'react'
import { PasswordProtection } from './PasswordProtection'

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function WithAuth(props: P) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
      setIsClient(true)
    }, [])

    if (!isClient) {
      return null
    }

    return (
      <PasswordProtection>
        <WrappedComponent {...props} />
      </PasswordProtection>
    )
  }
}


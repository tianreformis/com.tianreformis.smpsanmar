'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './theme-provider'
import { FontProvider } from './font-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <FontProvider>
          {children}
        </FontProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

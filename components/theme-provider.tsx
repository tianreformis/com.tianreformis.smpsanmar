'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light'
})

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getResolvedTheme(saved: Theme): 'dark' | 'light' {
  if (saved === 'system') return getSystemTheme()
  return saved
}

function isDarkMode(theme: Theme): boolean {
  const resolved = getResolvedTheme(theme)
  return resolved === 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'system'
    setThemeState(saved)

    const isDark = getResolvedTheme(saved)
    setResolvedTheme(isDark)
    document.documentElement.classList.toggle('dark', isDark === 'dark')

    setInitialized(true)
  }, [])

  useEffect(() => {
    if (!initialized) return

    localStorage.setItem('theme', theme)
    const isDark = getResolvedTheme(theme)
    setResolvedTheme(isDark)
    document.documentElement.classList.toggle('dark', isDark === 'dark')
  }, [theme, initialized])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const isDark = getSystemTheme()
      setResolvedTheme(isDark)
      document.documentElement.classList.toggle('dark', isDark === 'dark')
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

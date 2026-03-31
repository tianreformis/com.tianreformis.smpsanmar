'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type FontFamily = 'poppins' | 'inter' | 'roboto-slab' | 'merriweather' | 'fira-code'

interface FontContextType {
  fontFamily: FontFamily
  setFontFamily: (font: FontFamily) => void
}

const FontContext = createContext<FontContextType>({
  fontFamily: 'poppins',
  setFontFamily: () => {}
})

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamily] = useState<FontFamily>('poppins')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('fontFamily') as FontFamily
    if (saved) setFontFamily(saved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('fontFamily', fontFamily)
  }, [fontFamily, mounted])

  if (!mounted) return null

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily }}>
      <div className={`font-${fontFamily}`}>
        {children}
      </div>
    </FontContext.Provider>
  )
}

export const useFont = () => useContext(FontContext)

"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface MobileContextType {
  isMobile: boolean
}

const MobileContext = createContext<MobileContextType | undefined>(undefined)

export function MobileProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return <MobileContext.Provider value={{ isMobile }}>{children}</MobileContext.Provider>
}

export function useMobile() {
  const context = useContext(MobileContext)
  if (context === undefined) {
    throw new Error("useMobile must be used within a MobileProvider")
  }
  return context
}

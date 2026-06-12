"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface AuthorizeNetConfig {
  apiLoginId: string
  publicClientKey: string
  mode: "sandbox" | "production"
}

export const AuthorizeNetContext = createContext<AuthorizeNetConfig | null>(null)

export function useAuthorizeNet() {
  return useContext(AuthorizeNetContext)
}

interface AuthorizeNetWrapperProps {
  config: AuthorizeNetConfig
  children: React.ReactNode
}

declare global {
  interface Window {
    Accept?: any
  }
}

const AuthorizeNetWrapper: React.FC<AuthorizeNetWrapperProps> = ({ config, children }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Avoid loading twice
    if (window.Accept) { setScriptLoaded(true); return }

    const scriptSrc = config.mode === "production"
      ? "https://js.authorize.net/v1/Accept.js"
      : "https://jstest.authorize.net/v1/Accept.js"

    const existing = document.querySelector(`script[src="${scriptSrc}"]`)
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true))
      if (window.Accept) setScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = scriptSrc
    script.charset = "utf-8"
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [config.mode])

  if (!scriptLoaded) {
    return (
      <div className="w-full h-40 flex items-center justify-center border rounded-lg bg-gray-50 border-dashed">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Loading Secure Payment...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthorizeNetContext.Provider value={config}>
      {children}
    </AuthorizeNetContext.Provider>
  )
}

export default AuthorizeNetWrapper

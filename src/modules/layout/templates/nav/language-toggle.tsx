"use client"

import { useState, useEffect } from "react"

export default function LanguageToggle() {
  const [lang, setLang] = useState<"en" | "es">("en")

  useEffect(() => {
    const saved = localStorage.getItem("mhc_lang") as "en" | "es" | null
    if (saved === "es") {
      setLang("es")
      triggerTranslate("es")
    }
  }, [])

  function triggerTranslate(target: "en" | "es") {
    if (target === "es") {
      const trySelect = (attempts = 0) => {
        const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
        if (select) {
          select.value = "es"
          select.dispatchEvent(new Event("change"))
        } else if (attempts < 20) {
          setTimeout(() => trySelect(attempts + 1), 300)
        }
      }
      trySelect()
    } else {
      const cookie = document.cookie.match(/googtrans=([^;]+)/)
      if (cookie) {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname + ";"
        window.location.reload()
      }
    }
  }

  const toggle = (target: "en" | "es") => {
    setLang(target)
    localStorage.setItem("mhc_lang", target)
    triggerTranslate(target)
  }

  const primary = "var(--color-primary, #C9A84C)"

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      background: "#f3f4f6",
      borderRadius: "9999px",
      padding: "2px",
      gap: 0,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.05em",
    }}>
      <button
        onClick={() => toggle("en")}
        style={{
          padding: "4px 10px",
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer",
          background: lang === "en" ? primary : "transparent",
          color: lang === "en" ? "var(--button-text, #fff)" : "#6b7280",
          transition: "all 0.15s",
          fontWeight: 700,
          fontSize: 11,
        }}
      >
        EN
      </button>
      <button
        onClick={() => toggle("es")}
        style={{
          padding: "4px 10px",
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer",
          background: lang === "es" ? primary : "transparent",
          color: lang === "es" ? "var(--button-text, #fff)" : "#6b7280",
          transition: "all 0.15s",
          fontWeight: 700,
          fontSize: 11,
        }}
      >
        ES
      </button>
    </div>
  )
}

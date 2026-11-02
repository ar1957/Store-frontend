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
      // The widget's <select> (.goog-te-combo) only lists target languages
      // (here just "es") — there is no "en"/original option to select back to,
      // so restoring the original requires the cookie + a reload. Deleting the
      // cookie isn't enough: with NO googtrans cookie present, the widget falls
      // back to auto-detecting the browser's preferred language and silently
      // re-translates if it isn't English, immediately re-creating the cookie.
      // Setting it to "/en/en" (source == target) is Google's own signal for
      // "show original" and positively overrides that auto-detect fallback.
      forceGoogTransOriginal()
      window.location.reload()
    }
  }

  // Google's translate widget scopes the googtrans cookie to whatever domain level
  // it detects (sometimes the exact host, sometimes a parent domain on subdomains),
  // so we set every possible scope rather than guessing one.
  function forceGoogTransOriginal() {
    const attrs = "path=/;"
    document.cookie = `googtrans=/en/en; ${attrs}`
    const host = window.location.hostname
    document.cookie = `googtrans=/en/en; ${attrs} domain=${host};`
    const labels = host.split(".")
    for (let i = 0; i < labels.length - 1; i++) {
      const domain = labels.slice(i).join(".")
      document.cookie = `googtrans=/en/en; ${attrs} domain=.${domain};`
    }
  }

  const toggle = (target: "en" | "es") => {
    if (target === lang) return
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

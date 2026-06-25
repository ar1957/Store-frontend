"use client"

import { useEffect, useRef } from "react"

function resolveUrl(raw: string): string {
  const match = raw.match(/src=["']([^"']+)["']/i)
  let url = match ? match[1] : raw.trim()
  // Upgrade http:// to https:// — http resources are blocked on HTTPS pages (mixed content)
  if (url.startsWith("http://")) url = "https://" + url.slice(7)
  return url
}

function ScriptBadge({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Intercept document.write so legacy seal scripts that use it
    // render into our container instead of failing silently.
    const originalWrite = document.write.bind(document)
    const originalWriteln = document.writeln?.bind(document)
    let captured = ""
    document.write = (html: string) => { captured += html }
    if (document.writeln) {
      document.writeln = (html: string) => { captured += html + "\n" }
    }

    const script = document.createElement("script")
    script.src = src

    const restore = () => {
      document.write = originalWrite
      if (originalWriteln) document.writeln = originalWriteln
      if (captured) container.innerHTML = captured
    }

    script.onload = restore
    script.onerror = restore
    container.appendChild(script)

    return () => {
      document.write = originalWrite
      if (originalWriteln) document.writeln = originalWriteln
    }
  }, [src])

  return <div ref={containerRef} className="mt-1" />
}

export default function CertificationBadge({ url }: { url: string }) {
  const resolved = resolveUrl(url)
  if (resolved.toLowerCase().endsWith(".js")) {
    return <ScriptBadge src={resolved} />
  }
  return (
    <img
      src={resolved}
      alt="Certification badge"
      className="max-h-20 max-w-[130px] object-contain mt-1"
    />
  )
}

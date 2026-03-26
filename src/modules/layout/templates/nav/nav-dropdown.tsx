"use client"

import { useState, useRef, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavLink = { label: string; url: string; open_new_tab?: boolean; children?: NavLink[] }

function NavItem({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hasChildren = link.children && link.children.length > 0
  const isExternal = link.url.startsWith("http://") || link.url.startsWith("https://")

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (!hasChildren) {
    if (isExternal || link.open_new_tab) {
      return (
        <a
          href={link.url}
          target={link.open_new_tab ? "_blank" : undefined}
          rel={link.open_new_tab ? "noreferrer" : undefined}
          className="hover:opacity-70 transition-opacity whitespace-nowrap"
        >
          {link.label}
        </a>
      )
    }
    return (
      <LocalizedClientLink href={link.url} className="hover:opacity-70 transition-opacity whitespace-nowrap">
        {link.label}
      </LocalizedClientLink>
    )
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="flex items-center gap-1 hover:opacity-70 transition-opacity whitespace-nowrap"
        onClick={() => setOpen(p => !p)}
      >
        {link.url && link.url !== "#" ? (
          isExternal || link.open_new_tab ? (
            <a href={link.url} target={link.open_new_tab ? "_blank" : undefined} rel="noreferrer">{link.label}</a>
          ) : (
            <LocalizedClientLink href={link.url}>{link.label}</LocalizedClientLink>
          )
        ) : (
          <span>{link.label}</span>
        )}
        <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg min-w-[180px] z-50 py-1">
          {link.children!.map((child, i) => {
            const childExternal = child.url.startsWith("http://") || child.url.startsWith("https://")
            return (
              <div key={i}>
                {childExternal || child.open_new_tab ? (
                  <a
                    href={child.url}
                    target={child.open_new_tab ? "_blank" : undefined}
                    rel={child.open_new_tab ? "noreferrer" : undefined}
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </a>
                ) : (
                  <LocalizedClientLink
                    href={child.url}
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => setOpen(false)}
                  >
                    {child.label}
                  </LocalizedClientLink>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NavDropdown({ links }: { links: NavLink[] }) {
  return (
    <>
      {links.map((link, i) => <NavItem key={i} link={link} />)}
    </>
  )
}

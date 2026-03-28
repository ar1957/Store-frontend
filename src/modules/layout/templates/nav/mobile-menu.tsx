"use client"
import { useState } from "react"

type NavLink = { label: string; url: string; open_new_tab?: boolean; children?: NavLink[] }

export default function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        className="lg:hidden flex flex-col justify-center items-center gap-1 p-1"
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
      >
        <span style={{ display: "block", width: 22, height: 2, background: "#111", borderRadius: 2, transition: "all 0.2s", transform: open ? "rotate(45deg) translate(3px, 3px)" : "none" }} />
        <span style={{ display: "block", width: 22, height: 2, background: "#111", borderRadius: 2, transition: "all 0.2s", opacity: open ? 0 : 1 }} />
        <span style={{ display: "block", width: 22, height: 2, background: "#111", borderRadius: 2, transition: "all 0.2s", transform: open ? "rotate(-45deg) translate(3px, -3px)" : "none" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="lg:hidden fixed top-[56px] left-0 right-0 bg-white border-b border-ui-border-base shadow-md z-50">
          <div className="px-6 py-4 flex flex-col gap-3">
            {links.map((link, i) => (
              <div key={i}>
                <a
                  href={link.url}
                  target={link.open_new_tab ? "_blank" : undefined}
                  rel={link.open_new_tab ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="block text-sm font-bold uppercase tracking-wider text-black py-1 hover:opacity-70"
                >
                  {link.label}
                </a>
                {link.children?.map((child, j) => (
                  <a
                    key={j}
                    href={child.url}
                    target={child.open_new_tab ? "_blank" : undefined}
                    rel={child.open_new_tab ? "noopener noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                    className="block text-sm text-gray-600 py-1 pl-4 hover:opacity-70"
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

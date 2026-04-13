import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { MagnifyingGlass } from "@medusajs/icons"
import NavDropdown from "./nav-dropdown"
import MobileMenu from "./mobile-menu"

type NavLink = { label: string; url: string; open_new_tab?: boolean; children?: NavLink[] }

type NavProps = {
  logoUrl?: string | null
  getStartedUrl?: string | null
  navLinks?: NavLink[]
  clinicName?: string
}

export default function Nav({ logoUrl, getStartedUrl, navLinks, clinicName }: NavProps) {
  const links = navLinks && navLinks.length > 0 ? navLinks : []
  const startUrl = getStartedUrl || "/store"
  const startIsExternal = startUrl.startsWith("http://") || startUrl.startsWith("https://")

  return (
    <header className="sticky top-0 inset-x-0 z-50 group">
      <nav className="content-container flex items-center justify-between py-0 bg-white border-b border-ui-border-base">

        {/* Logo */}
        <div className="flex items-center">
          <LocalizedClientLink href="/store" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={clinicName || "Logo"}
                className="h-14 sm:h-24 w-auto object-contain max-w-[140px] sm:max-w-[260px]"
                style={{ display: "block" }}
              />
            ) : (
              <span className="text-base sm:text-xl font-bold italic uppercase tracking-tighter py-3">
                {clinicName || "Wellness Store"}
              </span>
            )}
          </LocalizedClientLink>
        </div>

        {/* Nav Links — centered, desktop only */}
        {links.length > 0 && (
          <div className="hidden lg:flex items-center gap-x-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black absolute left-1/2 -translate-x-1/2">
            <NavDropdown links={links} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-x-3 sm:gap-x-6">
          <button className="hidden lg:block text-black hover:opacity-70 transition-opacity">
            <MagnifyingGlass />
          </button>
          <CartButton />
          {startIsExternal ? (
            <a
              href={startUrl}
              style={{ background: "var(--color-primary, #FFD700)", color: "var(--button-text, #111)" }}
              className="hover:opacity-90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-opacity whitespace-nowrap"
            >
              Get Started
            </a>
          ) : (
            <LocalizedClientLink
              href={startUrl}
              style={{ background: "var(--color-primary, #FFD700)", color: "var(--button-text, #111)" }}
              className="hover:opacity-90 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-opacity whitespace-nowrap"
            >
              Get Started
            </LocalizedClientLink>
          )}
          {links.length > 0 && <MobileMenu links={links} />}
        </div>
      </nav>
    </header>
  )
}

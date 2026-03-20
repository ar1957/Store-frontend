import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { MagnifyingGlass } from "@medusajs/icons"

type NavLink = { label: string; url: string; open_new_tab?: boolean }

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

        {/* Logo — no extra padding, tight to nav edges */}
        <div className="flex items-center">
          <LocalizedClientLink href="/" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={clinicName || "Logo"}
                className="h-24 w-auto object-contain max-w-[260px]"
                style={{ display: "block" }}
              />
            ) : (
              <span className="text-xl font-bold italic uppercase tracking-tighter py-3">
                {clinicName || "Wellness Store"}
              </span>
            )}
          </LocalizedClientLink>
        </div>

        {/* Nav Links — absolutely centered in the nav */}
        {links.length > 0 && (
          <div className="hidden lg:flex items-center gap-x-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black absolute left-1/2 -translate-x-1/2">
            {links.map((link, i) => {
              const isExternal = link.url.startsWith("http://") || link.url.startsWith("https://")
              if (isExternal || link.open_new_tab) {
                return (
                  <a
                    key={i}
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
                <LocalizedClientLink
                  key={i}
                  href={link.url}
                  className="hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  {link.label}
                </LocalizedClientLink>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-x-6">
          <button className="hidden lg:block text-black hover:opacity-70 transition-opacity">
            <MagnifyingGlass />
          </button>
          <CartButton />
          {startIsExternal ? (
            <a
              href={startUrl}
              className="bg-[#FFD700] hover:bg-[#e6c200] text-black px-5 py-2.5 rounded font-bold text-[11px] uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              Get Started
            </a>
          ) : (
            <LocalizedClientLink
              href={startUrl}
              className="bg-[#FFD700] hover:bg-[#e6c200] text-black px-5 py-2.5 rounded font-bold text-[11px] uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              Get Started
            </LocalizedClientLink>
          )}
        </div>

      </nav>
    </header>
  )
}
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

type NavLink = { label: string; url: string; open_new_tab?: boolean; children?: NavLink[] }
type SocialLink = { platform: string; url: string }

type FooterProps = {
  footerLinks?: NavLink[]
  bottomLinks?: NavLink[]
  logoUrl?: string | null
  clinicName?: string
  contactPhone?: string | null
  contactEmail?: string | null
  contactAddress?: string | null
  socialLinks?: SocialLink[]
  certificationImageUrl?: string | null
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase()
  if (p.includes("facebook")) return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  )
  if (p.includes("instagram")) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
  if (p.includes("tiktok")) return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  )
  if (p.includes("youtube")) return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
      <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  )
  if (p.includes("twitter") || p.includes("x")) return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
  if (p.includes("linkedin")) return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  )
}

export default async function Footer({
  footerLinks, bottomLinks, logoUrl, clinicName,
  contactPhone, contactEmail, contactAddress, socialLinks, certificationImageUrl,
}: FooterProps) {
  const { collections } = await listCollections({ fields: "*products" })
  const productCategories = await listCategories()
  const links = footerLinks && footerLinks.length > 0 ? footerLinks : []
  const bLinks = bottomLinks && bottomLinks.length > 0 ? bottomLinks : []
  const socials = socialLinks && socialLinks.length > 0 ? socialLinks : []

  const meaningfulCategories = productCategories.filter(c => !c.parent_category)
  const meaningfulCollections = collections || []

  return (
    <footer className="border-t border-ui-border-base w-full bg-white">
      <div className="content-container flex flex-col w-full">

        {/* DISCLAIMER */}
        <div className="py-10 border-b border-ui-border-base text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-gray-800 text-xs uppercase mb-3 tracking-widest font-bold">
              IMPORTANT DISCLAIMER
            </h3>
            <div className="flex flex-col gap-y-3 text-gray-500 text-xs leading-relaxed">
              <p>These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
              <p>Individual results may vary. Always consult with a licensed healthcare provider before beginning any weight loss program or medication. This medication is compounded by a licensed pharmacy and is not FDA-approved. Side effects may occur. For full safety information, contraindications, and potential side effects, please review our <a href="/faq" className="text-gray-700 hover:underline">[FAQ page]</a>.</p>
              <p>{clinicName || "Contour Wellness"} provides access to compounded medications for eligible patients. Compounded medications are not FDA-approved and may vary in quality, safety, and efficacy compared to FDA-approved drugs. A licensed medical provider will conduct a telehealth Good Faith Exam (GFE) to assess patient eligibility prior to issuing any prescription. Not all individuals will qualify, and results may differ from person to person.</p>
              <p>Novo Nordisk Inc. and Eli Lilly and Company are the only U.S. manufacturers of FDA-approved semaglutide (Rybelsus®, Ozempic®, Wegovy®) and tirzepatide (Zepbound®, Mounjaro®), respectively. These manufacturers do not supply their medications for compounding purposes.</p>
            </div>
          </div>
        </div>

        {/* MAIN LINKS ROW */}
        <div className="flex flex-col xsmall:flex-row items-start justify-between gap-8 py-10">

          {/* Left: Brand + contact */}
          <div className="flex flex-col gap-y-2 w-[190px] shrink-0">
            <LocalizedClientLink href="/" className="flex items-center mb-2">
              {logoUrl ? (
                <img src={logoUrl} alt={clinicName || "Logo"} className="h-16 w-auto object-contain max-w-[170px]" />
              ) : (
                <span className="text-gray-800 font-bold uppercase text-base tracking-tight">
                  {clinicName || "Wellness Store"}
                </span>
              )}
            </LocalizedClientLink>

            {/* Social icons in filled circles */}
            {socials.length > 0 && (
              <div className="flex items-center gap-x-2 mb-1">
                {socials.map((sl, i) => (
                  <a key={i} href={sl.url} target="_blank" rel="noreferrer" aria-label={sl.platform}
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-900 transition-colors flex items-center justify-center text-white shrink-0">
                    <SocialIcon platform={sl.platform} />
                  </a>
                ))}
              </div>
            )}

            {contactPhone && (
              <a href={`tel:${contactPhone.replace(/\D/g, "")}`} className="text-gray-700 text-sm hover:text-black">
                {contactPhone}
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="text-gray-700 text-sm hover:text-black break-all">
                {contactEmail}
              </a>
            )}
            {contactAddress && (
              <address className="text-gray-700 text-sm not-italic whitespace-pre-line leading-snug">
                {contactAddress}
              </address>
            )}
            {certificationImageUrl && (
              <img src={certificationImageUrl} alt="Certification badge" className="max-h-20 max-w-[130px] object-contain mt-1" />
            )}
          </div>

          {/* Right: link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-x-14 text-sm flex-1">
            {meaningfulCategories.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-1">Categories</span>
                <ul className="flex flex-col gap-y-1">
                  {meaningfulCategories.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink className="text-gray-600 hover:text-black transition-colors" href={`/categories/${c.handle}`}>
                        {c.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {meaningfulCollections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-1">Collections</span>
                <ul className="flex flex-col gap-y-1">
                  {meaningfulCollections.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink className="text-gray-600 hover:text-black transition-colors" href={`/collections/${c.handle}`}>
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {links.length > 0 && (() => {
              const groups = links.filter(l => l.children && l.children.length > 0)
              const flatLinks = links.filter(l => !l.children || l.children.length === 0)
              return (
                <>
                  {flatLinks.length > 0 && (
                    <div className="flex flex-col gap-y-2">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-1">Links</span>
                      <ul className="flex flex-col gap-y-1">
                        {flatLinks.map((link, i) => (
                          <li key={i}>
                            <a href={link.url} target={link.open_new_tab ? "_blank" : undefined}
                              rel={link.open_new_tab ? "noreferrer" : undefined}
                              className="text-gray-600 hover:text-black transition-colors">
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {groups.map((group, gi) => (
                    <div key={gi} className="flex flex-col gap-y-2">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-1">
                        {group.url && group.url !== "#" ? (
                          <a href={group.url} target={group.open_new_tab ? "_blank" : undefined}
                            rel={group.open_new_tab ? "noreferrer" : undefined}
                            className="hover:text-black transition-colors">
                            {group.label}
                          </a>
                        ) : group.label}
                      </span>
                      <ul className="flex flex-col gap-y-1">
                        {(group.children || []).map((child, ci) => (
                          <li key={ci}>
                            <a href={child.url} target={child.open_new_tab ? "_blank" : undefined}
                              rel={child.open_new_tab ? "noreferrer" : undefined}
                              className="text-gray-600 hover:text-black transition-colors">
                              {child.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-ui-border-base py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Text className="text-xs text-gray-500">
            © {new Date().getFullYear()} {clinicName || "Wellness Store"}. All rights reserved.
          </Text>

          {bLinks.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {bLinks.map((link, i) => (
                <a key={i} href={link.url}
                  target={link.open_new_tab ? "_blank" : undefined}
                  rel={link.open_new_tab ? "noreferrer" : undefined}
                  className="text-xs text-gray-500 hover:text-black transition-colors whitespace-nowrap">
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <MedusaCTA />
        </div>

      </div>
    </footer>
  )
}

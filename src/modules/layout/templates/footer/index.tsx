import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

type NavLink = { label: string; url: string; open_new_tab?: boolean }

type FooterProps = {
  footerLinks?: NavLink[]
  logoUrl?: string | null
  clinicName?: string
}

export default async function Footer({ footerLinks, logoUrl, clinicName }: FooterProps) {
  const { collections } = await listCollections({ fields: "*products" })
  const productCategories = await listCategories()
  const links = footerLinks && footerLinks.length > 0 ? footerLinks : []

  const meaningfulCategories = productCategories.filter(c => !c.parent_category)
  const meaningfulCollections = collections || []

  return (
    <footer className="border-t border-ui-border-base w-full bg-white">
      <div className="content-container flex flex-col w-full">
        
        {/* --- IMPORTANT DISCLAIMER SECTION --- */}
        <div className="py-12 border-b border-ui-border-base text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-ui-fg-base txt-compact-small-plus uppercase mb-4 tracking-widest font-bold">
              IMPORTANT DISCLAIMER
            </h3>
            <div className="flex flex-col gap-y-4 text-ui-fg-subtle text-xs leading-relaxed">
              <p>
                These statements have not been evaluated by the Food and Drug Administration. 
                This product is not intended to diagnose, treat, cure, or prevent any disease.
              </p>
              <p>
                Individual results may vary. Always consult with a licensed healthcare provider 
                before beginning any weight loss program or medication. This medication is 
                compounded by a licensed pharmacy and is not FDA-approved. Side effects may occur. 
                For full safety information, contraindications, and potential side effects, 
                please review our <a href="/faq" className="text-ui-fg-interactive hover:underline">[FAQ page]</a>.
              </p>
              <p>
                {clinicName || "Contour Wellness"} provides access to compounded medications for eligible patients. 
                Compounded medications are not FDA-approved and may vary in quality, safety, 
                and efficacy compared to FDA-approved drugs. A licensed medical provider will 
                conduct a telehealth Good Faith Exam (GFE) to assess patient eligibility prior 
                to issuing any prescription. Not all individuals will qualify, and results may 
                differ from person to person.
              </p>
              <p>
                Novo Nordisk Inc. and Eli Lilly and Company are the only U.S. manufacturers of 
                FDA-approved semaglutide (Rybelsus®, Ozempic®, Wegovy®) and tirzepatide 
                (Zepbound®, Mounjaro®), respectively. These manufacturers do not supply 
                their medications for compounding purposes.
              </p>
            </div>
          </div>
        </div>

        {/* --- MAIN FOOTER LINKS --- */}
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-16">
          
          {/* Brand */}
          <div className="flex flex-col gap-y-4 max-w-[200px]">
            <LocalizedClientLink href="/" className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={clinicName || "Logo"}
                  className="h-24 w-auto object-contain max-w-[260px]"
                />
              ) : (
                <span className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase font-bold">
                  {clinicName || "Wellness Store"}
                </span>
              )}
            </LocalizedClientLink>
          </div>

          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {/* Product Categories */}
            {meaningfulCategories.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">Categories</span>
                <ul className="grid grid-cols-1 gap-2">
                  {meaningfulCategories.slice(0, 6).map((c) => (
                    <li className="text-ui-fg-subtle txt-small" key={c.id}>
                      <LocalizedClientLink className="hover:text-ui-fg-base" href={`/categories/${c.handle}`}>
                        {c.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Collections */}
            {meaningfulCollections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">Collections</span>
                <ul className="grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small">
                  {meaningfulCollections.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink className="hover:text-ui-fg-base" href={`/collections/${c.handle}`}>
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dynamic Links */}
            {links.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">Links</span>
                <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                  {links.map((link, i) => (
                    <li key={i}>
                      <a href={link.url} className="hover:text-ui-fg-base">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full mb-8 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {clinicName || "Wellness Store"}. All rights reserved.
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { getTenantFromHeaders } from "@hooks/useTenant"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

function getContrastColor(hex: string): string {
  const clean = (hex || "#111111").replace("#", "").padEnd(6, "0")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#111111" : "#ffffff"
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const tenant = await getTenantFromHeaders()
  const brandColor = tenant.colors.primary || "#111111"
  const buttonTextColor = getContrastColor(brandColor)

  return (
    <html lang="en" data-mode="light">
      <head>
        <title>{tenant.name}</title>
        <style>{`
          :root {
            --color-primary:     ${brandColor};
            --color-background:  ${tenant.colors.background};
            --color-bg-alt:      ${tenant.colors.backgroundAlt};
            --color-accent:      ${tenant.colors.accent};
            --color-text:        ${tenant.colors.text};
            --button-text:       ${buttonTextColor};
          }

          body {
            background-color: var(--color-background);
            color:            var(--color-text);
          }
        `}</style>
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
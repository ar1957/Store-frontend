import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { getTenantFromHeaders } from "@hooks/useTenant"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const tenant = await getTenantFromHeaders()

  return (
    <html lang="en" data-mode="light">
      <head>
        <title>{tenant.name}</title>
        <style>{`
          :root {
            --color-primary:     ${tenant.colors.primary};
            --color-background:  ${tenant.colors.background};
            --color-bg-alt:      ${tenant.colors.backgroundAlt};
            --color-accent:      ${tenant.colors.accent};
            --color-text:        ${tenant.colors.text};
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
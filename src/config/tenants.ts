// Type definition only — tenant data is now fetched from the database
// via /store/clinics/tenant-config endpoint

export type Tenant = {
  name: string
  logo: string
  apiKey: string
  domain: string
  colors: {
    primary: string
    background: string
    backgroundAlt: string
    accent: string
    text: string
  }
  nav: string[]
  ctaText: string
  phone: string
  hours: string
  email: string
}

// Fallback for when DB is unavailable (dev/error cases)
export const DEFAULT_TENANT: Tenant = {
  name: "Wellness Store",
  logo: "",
  apiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  domain: "localhost:8000",
  colors: {
    primary:       "#111111",
    background:    "#ffffff",
    backgroundAlt: "#f9fafb",
    accent:        "#111111",
    text:          "#111111",
  },
  nav: [],
  ctaText: "Get Started",
  phone: "",
  hours: "",
  email: "",
}
import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Baseline Lab Work Waiver" }

async function getClinicName(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host") || ""
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backend}/store/clinics/tenant-config`, {
      headers: { "x-forwarded-host": host, "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      cache: "no-store",
    })
    if (res.ok) { const data = await res.json(); return data?.tenant?.name || "Our Clinic" }
  } catch {}
  return "Our Clinic"
}

export default async function LabWorkWaiverPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Baseline Lab Work Waiver</h1>
      <p className="text-lg text-ui-fg-muted mb-8">{clinic}</p>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>

        <p>You choose to waive baseline laboratory testing before starting GLP-1 or GLP-1/GIP treatment at {clinic}.</p>

        <p>You understand baseline lab work supports safer prescribing and often includes evaluation of kidney function, liver enzymes, thyroid levels, blood counts, and related markers.</p>

        <p>You understand proceeding without baseline labs increases risk of undetected conditions that affect treatment safety, including kidney impairment, liver dysfunction, thyroid abnormalities, electrolyte imbalances, or other medical issues.</p>

        <p>Your provider reviewed these risks with you. You confirm you provided accurate and complete medical history, current medications, supplements, and known health conditions.</p>

        <p>You agree to monitor your health, report new or worsening symptoms promptly, and follow medical guidance during treatment.</p>

        <p>You confirm this decision is voluntary and made after discussion with your provider. You understand laboratory testing might be required later to continue or adjust treatment, and you can request lab testing at any time.</p>

        <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <p className="font-semibold">By proceeding, you accept responsibility for choosing to start treatment without baseline laboratory evaluation.</p>
        </div>

      </div>
    </div>
  )
}

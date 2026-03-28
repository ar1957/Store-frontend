import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "GLP-1 Treatment Laboratory Testing Waiver" }

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

export default async function GLP1WaiverPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">GLP-1 Treatment Laboratory Testing Waiver</h1>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
        <p>At {clinic}, patient safety is our priority. Before starting GLP-1 medications such as semaglutide or tirzepatide, we recommend baseline lab tests to evaluate kidney and pancreatic function.</p>

        <h2 className="text-xl font-semibold mt-6">Recommended Lab Tests</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Renal Function Panel</strong> – To assess kidney health.</li>
          <li><strong>Lipase Test</strong> – To evaluate pancreatic function.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Purpose of Testing</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Identify any health conditions that may increase risk.</li>
          <li>Support safe and effective dosage.</li>
          <li>Help personalize your treatment plan.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Important Notice</h2>
        <p>While these tests are strongly recommended, you have the option to decline. By proceeding, you confirm that:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>You have been informed of the benefits of baseline lab testing.</li>
          <li>You understand that declining these tests may increase your risk of undetected side effects or complications.</li>
          <li>You voluntarily choose to waive the recommended tests and proceed with treatment.</li>
        </ul>

        <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <p className="font-semibold">By proceeding with your order, you acknowledge the above and voluntarily waive the recommended lab testing for GLP-1 treatment. You accept full responsibility for this decision.</p>
        </div>

        <p className="mt-6">If you have any questions before proceeding, please contact your provider at {clinic}.</p>
      </div>
    </div>
  )
}

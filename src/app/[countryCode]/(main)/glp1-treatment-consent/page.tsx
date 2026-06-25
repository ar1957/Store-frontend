import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Informed Consent for GLP-1 and GLP-1/GIP Treatments" }

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

export default async function GLP1TreatmentConsentPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Informed Consent for GLP-1 and GLP-1/GIP Treatments</h1>
      <p className="text-lg text-ui-fg-muted mb-8">{clinic}</p>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>

        <h2 className="text-xl font-semibold mt-6">Treatment Consent</h2>
        <p>You consent to receive treatment with compounded GLP-1 or GLP-1/GIP medications, including semaglutide or tirzepatide, for weight loss or metabolic support through {clinic}.</p>
        <p>You understand these medications are prepared and dispensed by licensed third-party pharmacies. They are not the same as FDA-approved brand products such as Ozempic, Wegovy, Mounjaro, or Zepbound.</p>

        <h2 className="text-xl font-semibold mt-6">Potential Benefits</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Potential weight loss</li>
          <li>Potential improvement in blood sugar control</li>
          <li>Reduced appetite</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Risks and Side Effects</h2>
        <p>You understand possible risks and side effects include:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nausea, vomiting, diarrhea, constipation</li>
          <li>Abdominal pain</li>
          <li>Fatigue, headache, dizziness</li>
          <li>Injection site reactions</li>
          <li>Low blood sugar</li>
          <li>Pancreatitis</li>
          <li>Gallbladder problems</li>
          <li>Kidney issues</li>
          <li>Thyroid tumors observed in animal studies</li>
          <li>Allergic reactions</li>
          <li>Rare severe gastrointestinal effects such as ileus or bowel obstruction</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Compounded Medication Disclosure</h2>
        <p>You understand compounded medications do not undergo FDA premarket approval. These medications are prepared by state-licensed pharmacies regulated by state pharmacy boards and required to follow applicable FDA standards and pharmacy regulations for compounding, quality, and safety.</p>
        <p>You understand compounded formulations are patient-specific and differ from commercially manufactured brand products.</p>

        <h2 className="text-xl font-semibold mt-6">Medical History and Alternatives</h2>
        <p>You confirm you provided complete and accurate information regarding your medical history, allergies, current medications, and supplements. You discussed alternatives such as nutrition changes, physical activity, other medications, or surgical options with your provider.</p>

        <h2 className="text-xl font-semibold mt-6">Your Responsibilities</h2>
        <p>You agree to follow prescribed dosing instructions, report side effects promptly, and participate in follow-up evaluations as requested.</p>

        <h2 className="text-xl font-semibold mt-6">Results and Discontinuation</h2>
        <p>You understand results vary. You may stop treatment at any time by communicating with your provider.</p>

        <h2 className="text-xl font-semibold mt-6">Lifestyle Expectations</h2>
        <p>You understand GLP-1 and GLP-1/GIP medications are not a substitute for healthy eating or physical activity. You understand long-term and sustainable weight loss requires active lifestyle changes while on medication and beyond.</p>
        <p>You agree to support treatment outcomes by practicing healthy eating, regular physical activity, adequate sleep, stress resilience, avoidance of risky substances, and positive social support habits.</p>

        <h2 className="text-xl font-semibold mt-6">Release</h2>
        <p>You acknowledge receipt and review of this information and release the clinic from liability related to unforeseen complications associated with treatment.</p>

        <div className="mt-8 p-6 border border-amber-200 rounded-lg bg-amber-50">
          <h3 className="font-semibold text-amber-900 mb-2">Important Safety Notice</h3>
          <p className="text-amber-800">Seek urgent medical care for severe abdominal pain, persistent vomiting, fainting, trouble breathing, or signs of an allergic reaction. Call 911 or go to the nearest emergency room if symptoms are severe or worsening.</p>
        </div>

        <h2 className="text-xl font-semibold mt-6">Dispute Resolution Notice</h2>
        <p>Any dispute related to these terms or the services provided by {clinic} will be resolved through binding arbitration rather than court proceedings. This process applies to all current and future services.</p>

      </div>
    </div>
  )
}

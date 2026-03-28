import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Telehealth Consent" }

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

export default async function TelehealthConsentPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Telehealth Consent</h1>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
        <p>The purpose of this consent (&ldquo;Consent&rdquo;) is to provide you with information about telehealth and to obtain your informed consent to the use of telehealth in the delivery of {clinic} services to you by certain {clinic} personnel (&ldquo;Providers&rdquo;). In this Consent, the terms &ldquo;you&rdquo; and &ldquo;yours&rdquo; refer to the person using the Service.</p>

        <h2 className="text-xl font-semibold mt-6">What is Telehealth?</h2>
        <p>Telehealth involves the delivery of health services using electronic communications, information technology, or other means between a healthcare provider and a patient who is not in the same physical location. Telehealth services may include video consultations, electronic transmission of medical information, and remote monitoring.</p>

        <h2 className="text-xl font-semibold mt-6">Potential Benefits</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Improved access to care from the comfort of your home</li>
          <li>Reduced travel time and associated costs</li>
          <li>Timely access to medical consultations</li>
          <li>Continuity of care between in-person visits</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Potential Risks</h2>
        <p>As with any medical service, there are potential risks associated with telehealth, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Technical difficulties may interrupt or prevent a consultation</li>
          <li>Security protocols may fail, resulting in a breach of privacy</li>
          <li>Lack of physical examination may limit the Provider&apos;s ability to make a complete assessment</li>
          <li>Telehealth services are not a substitute for in-person care in all cases</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Your Rights</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You have the right to withhold or withdraw consent to telehealth at any time</li>
          <li>You have the right to inspect all information transmitted during a telehealth consultation</li>
          <li>You have the right to request an in-person consultation instead of telehealth</li>
          <li>Withholding or withdrawing consent will not affect your right to future care</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Confidentiality</h2>
        <p>All telehealth consultations are subject to the same confidentiality protections as in-person visits. {clinic} uses secure, encrypted technology to protect your health information during telehealth sessions.</p>

        <h2 className="text-xl font-semibold mt-6">Your Consent</h2>
        <p>BY CLICKING &ldquo;I AGREE,&rdquo; CHECKING A RELATED BOX TO SIGNIFY YOUR ACCEPTANCE, OR OTHERWISE AFFIRMATIVELY ACCEPTING THIS CONSENT, YOU ACKNOWLEDGE THAT YOU HAVE READ, ACCEPTED, AND AGREED TO BE BOUND BY THIS CONSENT.</p>
        <p>You confirm that you understand the information provided above, that you have had the opportunity to ask questions, and that you voluntarily consent to receive telehealth services from {clinic}.</p>
      </div>
    </div>
  )
}

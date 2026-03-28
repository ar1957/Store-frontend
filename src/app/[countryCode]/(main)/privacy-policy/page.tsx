import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Privacy Policy" }

async function getClinicName(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host") || ""
    const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const res = await fetch(`${backend}/store/clinics/tenant-config`, {
      headers: { "x-forwarded-host": host, "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      return data?.tenant?.name || "Our Clinic"
    }
  } catch {}
  return "Our Clinic"
}

export default async function PrivacyPolicyPage() {
  const clinic = await getClinicName()

  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
        <p>At {clinic} (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), we respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services. By accessing or using our services, you agree to the terms outlined in this Privacy Policy.</p>

        <h2 className="text-xl font-semibold mt-6">Introduction</h2>
        <p>This Privacy Policy outlines the types of information {clinic} and its affiliates may collect from you or that you may provide when using the {clinic} website or any related mobile applications (collectively the &ldquo;Platform&rdquo;). This Privacy Policy also details our practices for collecting, using, maintaining, protecting, and disclosing your information.</p>

        <h2 className="text-xl font-semibold mt-6">Information We Collect</h2>
        <p>We collect various types of information including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Personal Information:</strong> Name, mailing address, email address, phone number, account information, billing details, and other personally identifiable information.</li>
          <li><strong>Health-Related Information:</strong> Clinical history, treatment records, and communications exchanged through our platform. All health-related information is handled in compliance with HIPAA.</li>
          <li><strong>Technical Information:</strong> Information about your internet connection, device, and usage details.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">How We Share Your Information</h2>
        <p>We do not sell your personal information. We may share your information with third-party service providers who assist us in operating our business, such as payment processors, IT service providers, and healthcare professionals involved in your care. We may also share information with regulatory authorities or law enforcement as required by law.</p>

        <h2 className="text-xl font-semibold mt-6">Your Rights Under HIPAA</h2>
        <p>As a healthcare provider, {clinic} complies with HIPAA. Under HIPAA, you have specific rights regarding your health information, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Accessing your records</li>
          <li>Correcting inaccurate information</li>
          <li>Requesting confidential communication</li>
          <li>Restricting disclosure</li>
          <li>Receiving an accounting of disclosures</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Data Security</h2>
        <p>We implement industry-standard safeguards to protect your information, including encryption, secure servers, role-based access controls, and periodic audits. While we strive to use commercially acceptable means to protect your information, no method of transmission over the internet is 100% secure.</p>

        <h2 className="text-xl font-semibold mt-6">Mobile Information Privacy</h2>
        <p>We do not share, sell, or disclose your mobile phone number, SMS consent, or any related personal information with third parties or affiliates for marketing or promotional purposes.</p>

        <h2 className="text-xl font-semibold mt-6">Children&apos;s Privacy</h2>
        <p>Our services are not intended for individuals under the age of 13. We do not knowingly collect or solicit personal information from anyone under 13.</p>

        <h2 className="text-xl font-semibold mt-6">Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy periodically. When we do, we will notify you through the Platform or by email.</p>

        <h2 className="text-xl font-semibold mt-6">Contact Information</h2>
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at support@{clinic.toLowerCase().replace(/\s+/g, "")}.com</p>
      </div>
    </div>
  )
}

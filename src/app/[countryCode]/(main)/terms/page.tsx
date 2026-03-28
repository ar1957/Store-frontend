import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Terms and Conditions" }

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

export default async function TermsPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
        <p>{clinic} and/or its affiliates or subsidiaries (collectively, &ldquo;Company&rdquo;, &ldquo;we&rdquo;, or &ldquo;us&rdquo;) owns and operates this website and related platforms (collectively, the &ldquo;Platform&rdquo;). Your access and use of the Platform are governed by these Terms and Conditions (&ldquo;Agreement&rdquo;).</p>

        <p className="font-semibold">BY CLICKING &ldquo;I AGREE,&rdquo; CHECKING A RELATED BOX, OR THROUGH YOUR CONTINUED USE OF THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, ACCEPTED, AND AGREED TO BE BOUND BY THIS AGREEMENT.</p>

        <h2 className="text-xl font-semibold mt-6">Acceptance of Terms</h2>
        <p>Your access to and use of the Service is subject to this Agreement, as well as all applicable laws and regulations. We reserve the right to revise or remove any part of this Agreement at any time. Changes are effective upon posting. Your continued use after a change constitutes your acceptance.</p>

        <h2 className="text-xl font-semibold mt-6">Your Relationship with Us</h2>
        <p>We make available to registered users certain products and services sold or offered by {clinic} as well as by third party medical providers, pharmacies, or other vendors. {clinic} is not a participating provider with any federal or state healthcare programs. By choosing to use the Service, you are specifically choosing to obtain products and services on a cash basis.</p>

        <h2 className="text-xl font-semibold mt-6">Prescription Products</h2>
        <p>Certain products available through the Service require a valid prescription by a licensed healthcare provider. You will not be able to obtain a prescription product unless you have completed a consultation with one of our providers, the provider has determined the prescription product is appropriate for you, and the provider has written a prescription.</p>

        <h2 className="text-xl font-semibold mt-6">Limited Use and Availability</h2>
        <p>Our Service is currently only available to individuals who are at least eighteen (18) years of age or older and who have accepted this Agreement. By using the Service, you represent and warrant that you meet these requirements.</p>

        <h2 className="text-xl font-semibold mt-6">Privacy Policy</h2>
        <p>{clinic} understands the importance of confidentiality and privacy regarding your personal information. Please see our Privacy Policy for a description of how we may collect, use, and disclose your personal information.</p>

        <h2 className="text-xl font-semibold mt-6">Disclaimers</h2>
        <p>THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; OR &ldquo;AS AVAILABLE&rdquo; BASIS. {clinic.toUpperCase()} DISCLAIMS ALL WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>

        <h2 className="text-xl font-semibold mt-6">Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT ALLOWED BY LAW, {clinic.toUpperCase()} WILL NOT BE RESPONSIBLE FOR ANY INCIDENTAL, INDIRECT, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</p>

        <h2 className="text-xl font-semibold mt-6">Dispute Resolution</h2>
        <p>Any controversy or claim arising out of or relating to these Terms shall be settled by binding arbitration in accordance with the commercial rules of the American Arbitration Association. YOU HEREBY WAIVE ANY RIGHT TO SUE IN COURT AND SPECIFICALLY WAIVE YOUR RIGHT TO A JURY TRIAL.</p>

        <h2 className="text-xl font-semibold mt-6">Governing Law</h2>
        <p>This Agreement will be governed by the laws of the State of California, without regard to any conflicts of law provisions.</p>

        <h2 className="text-xl font-semibold mt-6">Contacting Us</h2>
        <p>If you have any questions or concerns about this Agreement, please contact us.</p>
      </div>
    </div>
  )
}

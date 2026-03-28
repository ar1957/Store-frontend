import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Purchase Terms" }

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

export default async function PurchaseTermsPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Purchase Terms</h1>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
        <p>The {clinic} Purchase Terms (&ldquo;Purchase Terms&rdquo;) govern the terms of sale for any products or services purchased from {clinic}. By purchasing from us, you agree to these Purchase Terms and {clinic}&apos;s Terms and Conditions.</p>

        <h2 className="text-xl font-semibold mt-6">Offers of Products and Services</h2>
        <p>{clinic} reserves the right to refuse service to anyone, at any time, for any reason. We may limit, prohibit, or cancel orders for products or services at our sole discretion. If an order is canceled or limited, we will attempt to notify you via the contact information provided at the time of purchase.</p>

        <h2 className="text-xl font-semibold mt-6">Prices and Payment</h2>
        <p>Prices for products and services are subject to change without notice. By completing a purchase, you confirm that you are authorized to use the selected payment method and authorize us to charge the total amount, including taxes.</p>
        <p>Our treatments are elective, non-insured procedures. Payment is due prior to services being rendered, and {clinic} does not submit claims to insurance providers. Customers are solely responsible for any fees and taxes associated with their purchases.</p>

        <h2 className="text-xl font-semibold mt-6">Chargebacks</h2>
        <p>A chargeback is a reversal of a payment made using your payment method. If you dispute a charge without contacting us first, {clinic} reserves the right to cancel pending orders and pursue remedies under applicable law. Please contact us immediately if you believe a charge was made in error.</p>

        <h2 className="text-xl font-semibold mt-6">Cancellation Policy</h2>
        <p>We require at least 24 hours&apos; notice to cancel or reschedule an appointment. Failure to provide adequate notice or failure to show up for a scheduled appointment will result in forfeiture of any prepaid services associated with the booking.</p>

        <h2 className="text-xl font-semibold mt-6">Returns and Refunds</h2>
        <p>All sales are final. Treatments included as complimentary with other purchases are non-refundable and have no monetary value. Should {clinic}, at its sole discretion, decide to issue a refund, such refunds may only be issued as store credit. Unused or unrendered treatments cannot be transferred to another customer.</p>

        <h2 className="text-xl font-semibold mt-6">Contact Us</h2>
        <p>If you have any questions or concerns about these Purchase Terms, please contact us. Thank you for choosing {clinic}!</p>
      </div>
    </div>
  )
}

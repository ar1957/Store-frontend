import { headers } from "next/headers"
import { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Shipping, Refund and Returns Policy" }

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

export default async function ShippingPolicyPage() {
  const clinic = await getClinicName()
  return (
    <div className="content-container py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shipping, Refund and Returns Policy</h1>
      <div className="prose prose-sm max-w-none text-ui-fg-subtle space-y-4" style={{ lineHeight: 1.8 }}>
        <p>At {clinic}, we are committed to providing high-quality, personalized medications, supplements, devices, and other healthcare products. Due to the customized nature of these products, we cannot accept returns under any circumstances. This policy ensures the safety and integrity of the treatments provided to our valued customers.</p>

        <h2 className="text-xl font-semibold mt-6">1. Pharmacy Processing &amp; Order Fulfillment</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>All prescription orders are reviewed, verified, and filled by a licensed pharmacy, strictly in accordance with federal and state laws.</li>
          <li>Processing time for standard orders is typically 3–5 business days, excluding weekends and recognized holidays.</li>
          <li>We do not process or ship prescription orders on Fridays, Saturdays, or Sundays in order to preserve product quality and ensure timely delivery.</li>
          <li>Expedited processing is available upon request for an additional fee and must be approved in advance.</li>
          <li>Orders are fulfilled in the order in which they are received.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">2. Address Accuracy &amp; Client Responsibility</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Clients are solely responsible for ensuring that the shipping address provided at checkout is complete, accurate, and deliverable.</li>
          <li>If an order is undeliverable or delayed due to an incorrect or incomplete address, {clinic} and its pharmacy partners accept no liability for loss, replacement, or additional costs incurred.</li>
          <li>Changes to a shipping address after an order has been placed are not guaranteed and must be requested immediately in writing.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">3. Delivery Confirmation &amp; Title Transfer</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Title and risk of loss for any products ordered transfer to the client upon carrier confirmation of delivery.</li>
          <li>Delivery confirmation by the shipping carrier is deemed legally sufficient proof of delivery.</li>
          <li>Clients agree that neither {clinic} nor the pharmacy is liable for packages that are lost, stolen, or misplaced after confirmed delivery.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">4. Refunds, Replacements &amp; Claims</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Refunds or replacements will not be issued for orders confirmed as delivered unless a verified shipping error occurred on our part.</li>
          <li>Clients must notify us in writing within 48 hours of any non-delivery or delivery issue.</li>
          <li>Clients must fully cooperate with any carrier investigation or insurance claim process.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6">Refunds</h2>
        <p>While all products are non-refundable, we understand that issues may arise during shipping or delivery. If you experience damaged items, incorrect shipment, or missing items, please contact us within 48 hours of receiving your order with:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Order Number</li>
          <li>Tracking Number</li>
          <li>Photo Evidence of Damage (if applicable)</li>
        </ul>
        <p>If a refund is approved, it will be processed within 15 business days of approval.</p>

        <h2 className="text-xl font-semibold mt-6">Cancellation</h2>
        <p>If you need to cancel your consultation or prescription, please note that cancellation fees may apply depending on when the request is made. A fee will apply if you cancel after your consultation has been completed. A higher fee will apply if you cancel after your prescription has been written and the pharmacy has already started processing your order.</p>

        <h2 className="text-xl font-semibold mt-6">Contact Us</h2>
        <p>We&apos;re here to help you every step of the way. Whether you have questions about our products, need assistance with an order, or simply want to learn more about our services, our dedicated support team at {clinic} is ready to assist you.</p>
      </div>
    </div>
  )
}

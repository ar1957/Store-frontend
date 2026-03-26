import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  // Extract the clinic domain from order metadata — stored during eligibility screening
  // Uses +metadata field (explicitly fetched) so it's available at render time
  const orderMeta = order.metadata as Record<string, any> | null
  const clinicDomain: string | null = 
    orderMeta?.eligibility?.domain || 
    orderMeta?.domain || 
    null

  console.log("[ConfirmedPage] order.metadata:", JSON.stringify(orderMeta), "clinicDomain:", clinicDomain)

  return <OrderCompletedTemplate order={order} clinicDomain={clinicDomain} />
}

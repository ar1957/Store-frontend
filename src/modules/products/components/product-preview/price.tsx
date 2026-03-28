import { Text } from "@medusajs/ui"
import { VariantPrice } from "types/global"

function formatPrice(price: string): string {
  // Remove .00 decimal — e.g. "$215.00" → "$215", "$215.50" stays "$215.50"
  return price.replace(/\.00$/, "")
}

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <>
      {price.price_type === "sale" && (
        <Text
          className="line-through"
          style={{ color: "#9ca3af" }}
          data-testid="original-price"
        >
          {formatPrice(price.original_price)}
        </Text>
      )}
      <Text
        style={{ color: price.price_type === "sale" ? "var(--color-primary, #C9A84C)" : "#111", fontSize: 20, fontWeight: 800 }}
        data-testid="price"
      >
        {formatPrice(price.calculated_price)}
      </Text>
    </>
  )
}

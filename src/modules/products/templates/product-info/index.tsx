import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

// Strip accessibility widget attributes that interfere with styling
function cleanHtml(html: string): string {
  return html.replace(/\s*data-asw-[a-z0-9-]+="[^"]*"/g, "")
}

// Detect if string is HTML (contains tags or encoded tags)
function isHtml(str: string): boolean {
  return str.includes("<") || str.includes("&lt;")
}

// Decode HTML entities if needed
function decodeIfEncoded(str: string): string {
  if (str.includes("&lt;")) {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
  return str
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="w-full">
      <div className="flex flex-col gap-y-4 w-full">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {product.description && (
          isHtml(product.description) ? (
            <div
              data-testid="product-description"
              dangerouslySetInnerHTML={{ __html: cleanHtml(decodeIfEncoded(product.description)) }}
              style={{ fontSize: "0.9375rem", lineHeight: "1.7", color: "#374151" }}
            />
          ) : (
            <Text
              className="text-medium text-ui-fg-subtle whitespace-pre-line"
              data-testid="product-description"
            >
              {product.description}
            </Text>
          )
        )}
      </div>
    </div>
  )
}

export default ProductInfo

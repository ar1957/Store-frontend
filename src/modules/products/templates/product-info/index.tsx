import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
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

        {product.subtitle && (
          product.subtitle.includes("<") ? (
            <div
              className="text-medium text-ui-fg-subtle"
              data-testid="product-subtitle"
              dangerouslySetInnerHTML={{ __html: product.subtitle }}
            />
          ) : (
            <Text className="text-medium text-ui-fg-subtle font-semibold" data-testid="product-subtitle">
              {product.subtitle}
            </Text>
          )
        )}

        {product.description && (
          product.description.includes("<") ? (
            <div
              className="text-medium text-ui-fg-subtle prose prose-sm max-w-none"
              data-testid="product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
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

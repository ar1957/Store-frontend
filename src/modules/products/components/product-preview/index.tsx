import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const thumbnail = product.thumbnail || (product as any).images?.[0]?.url

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--color-primary, #1a1a1a)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        className="group-hover:shadow-xl"
      >
        {/* ── Title + Price header ── */}
        <div style={{ padding: "16px 18px 12px", background: "var(--color-primary, #1a1a1a)", textAlign: "center" }}>
          <div
            data-testid="product-title"
            style={{
              color: "#111",
              fontWeight: 700,
              fontSize: 20,
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            {product.title}
          </div>
          {cheapestPrice && (
            <div style={{ color: "#111", fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}
        </div>

        {/* ── Product image ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            background: "#f5f5f0",
            borderRadius: "12px",
            overflow: "hidden",
            margin: "0 0 0 0",
          }}
        >
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={product.title ?? "Product"}
              fill
              className="object-cover object-center"
              sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, 480px"
              quality={75}
              draggable={false}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: 14,
              }}
            >
              No image
            </div>
          )}
        </div>

        {/* ── Subtitle / bullet points ── */}
        {product.subtitle && (
          <div
            style={{
              padding: "14px 18px 16px",
              background: "var(--color-primary, #1a1a1a)",
              flex: 1,
            }}
          >
            {/* If subtitle contains HTML tags, render as HTML; otherwise render as bullet lines */}
            {product.subtitle.includes("<") ? (
              <div
                style={{ color: "#111", fontSize: 13, lineHeight: 1.6 }}
                className="subtitle-html"
                dangerouslySetInnerHTML={{ __html: product.subtitle }}
              />
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {product.subtitle.split("\n").filter(Boolean).map((line, i) => (
                  <li
                    key={i}
                    style={{
                      color: "#111",
                      fontSize: 13,
                      lineHeight: 1.6,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: "var(--color-primary, #C9A84C)", marginTop: 2, flexShrink: 0 }}>●</span>
                    {line.replace(/^[-•●]\s*/, "")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}

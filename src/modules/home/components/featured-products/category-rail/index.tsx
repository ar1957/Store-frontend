import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export default async function CategoryRail({
  category,
  region,
}: {
  category: HttpTypes.StoreProductCategory
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      category_id: category.id,
      fields: "*variants.calculated_price",
      limit: 20,
    },
  })

  if (!products?.length) return null

  return (
    <div className="content-container pt-4 pb-0">
      <h2 className="text-4xl font-bold mb-4">{category.name}</h2>
      {category.description && (
        <div className="mb-8 text-base-regular">
          {category.description.includes("<") ? (
            <div
              style={{ lineHeight: 1.7 }}
              className="category-description"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          ) : (
            <p style={{ whiteSpace: "pre-line" }}>{category.description}</p>
          )}
        </div>
      )}
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}

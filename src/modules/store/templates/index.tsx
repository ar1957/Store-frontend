import { Suspense } from "react"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import CategoryRail from "@modules/home/components/featured-products/category-rail"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: string
  page?: string
  countryCode: string
}) => {
  const region = await getRegion(countryCode)
  const categories = await listCategories({ parent_category_id: "null" })

  if (!region) return null

  // If no categories, show flat product list fallback
  if (!categories?.length) {
    const { default: PaginatedProducts } = await import("./paginated-products")
    const { default: RefinementList } = await import("@modules/store/components/refinement-list")
    const pageNumber = page ? parseInt(page) : 1
    const sort = (sortBy || "created_at") as any
    return (
      <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
        <RefinementList sortBy={sort} />
        <div className="w-full">
          <div className="mb-8 text-2xl-semi">
            <h1 data-testid="store-page-title">All products</h1>
          </div>
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts sortBy={sort} page={pageNumber} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6" data-testid="category-container">
      {categories.map((category) => (
        <Suspense key={category.id} fallback={<SkeletonProductGrid />}>
          <CategoryRail category={category} region={region} />
        </Suspense>
      ))}
    </div>
  )
}

export default StoreTemplate

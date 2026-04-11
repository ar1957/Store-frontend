import { Metadata } from "next"
import Hero from "@modules/home/components/hero"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import CategoryRail from "@modules/home/components/featured-products/category-rail"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description: "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  // Fetch top-level categories only (no parent)
  const categories = await listCategories({ parent_category_id: "null" })

  if (!region) return null

  // If no categories set up yet, fall back gracefully
  if (!categories?.length) {
    return (
      <>
        <Hero />
        <div className="content-container py-12">
          <p className="text-ui-fg-subtle">No product categories found. Add categories in the admin to group products.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Hero />
      <div className="py-12">
        {categories.map((category) => (
          <CategoryRail key={category.id} category={category} region={region} />
        ))}
      </div>
    </>
  )
}

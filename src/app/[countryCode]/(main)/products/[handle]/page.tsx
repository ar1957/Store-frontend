import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )
    if (!countryCodes) return []

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })
      return { country, products: response.products }
    })

    const countryProducts = await Promise.all(promises)
    return countryProducts
      .flatMap((d) => d.products.map((p) => ({ countryCode: d.country, handle: p.handle })))
      .filter((p) => p.handle)
  } catch (e) {
    return []
  }
}

function getImagesForVariant(product: HttpTypes.StoreProduct, selectedVariantId?: string) {
  // Fix for Line 128: Ensure we always return an array
  if (!product?.images) return []
  if (!selectedVariantId || !product.variants) return product.images

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  
  // Fix for Lines 64 & 68: Safe check for variant images
  if (!variant?.images || variant.images.length === 0) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return (product.images ?? []).filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!product) notFound()

  return {
    title: `${product.title} | Medusa Store`,
    description: `${product.title}`,
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  if (!region) notFound()

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) notFound()

  const images = getImagesForVariant(pricedProduct, searchParams.v_id)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
    />
  )
}
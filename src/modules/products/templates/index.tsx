import React, { Suspense } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col py-6 relative"
        data-testid="product-container"
      >
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-x-12 mb-12">
          {/* LEFT COLUMN: Product Image */}
          <div className="block w-full relative">
            <ImageGallery images={images} />
          </div>

          {/* RIGHT COLUMN: Intake Card */}
          <div className="flex flex-col bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-black">Let's Get Started</h1>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                Begin Your Wellness Journey
              </p>
            </div>

            <div className="space-y-8 mb-10 text-gray-600">
              <div className="flex flex-col items-center">
                <h3 className="font-bold text-gray-900">Step 1: Complete Intake Form</h3>
                <p className="text-sm text-gray-500">Know current dose before Medical Provider Clearance</p>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="font-bold text-gray-900">Step 2: Complete Your Payment</h3>
                <p className="text-sm text-gray-500">Immediately After Your Purchase Is Complete</p>
                <p className="text-xs italic text-gray-400 mt-1">Just Click The Button To Virtually Connect</p>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="font-bold text-gray-900">Step 3: Meet Our Licensed Medical Provider</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Use any device with a camera and microphone to connect.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-y-4 border-t border-gray-50 pt-8">
              <div className="text-[10px] font-bold text-gray-400 space-y-1 uppercase">
                <p>7AM to 6PM PST Monday-Saturday</p>
                <p>9:30AM to 4:30 PM PST Sunday</p>
              </div>

              <div className="w-full max-w-[300px]">
                <Suspense
                  fallback={<ProductActions disabled={true} product={product} region={region} />}
                >
                  <ProductActionsWrapper id={product.id} region={region} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Just Product Info/Description */}
        <div className="w-full py-12 border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <ProductInfo product={product} />
            {/* ProductTabs removed to hide Information/Shipping accordions */}
          </div>
        </div>
      </div>

      <div className="content-container my-16 small:my-32">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
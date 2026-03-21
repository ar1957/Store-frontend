import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
  shopUrl = "/store",
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  shopUrl?: string
}) => {
  // If shopUrl is absolute, extract just the pathname so we don't double-prefix
  let shopHref = shopUrl
  try {
    const u = new URL(shopUrl)
    shopHref = u.pathname + u.search
  } catch {
    // already a relative path — use as-is
  }

  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col bg-white py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
              {/* Continue Shopping */}
              <div>
                <a
                  href={shopHref}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--color-primary, #111)",
                    color: "var(--button-text, #fff)",
                    padding: "12px 24px",
                    borderRadius: 16,
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                    transition: "opacity 0.15s",
                  }}
                >
                  ← Continue Shopping
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <div className="bg-white py-6">
                    <Summary cart={cart as any} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate

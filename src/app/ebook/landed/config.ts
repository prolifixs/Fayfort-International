// Launch settings for the Landed page. Values still undecided in the spec are
// left null and hidden on the page rather than shown as placeholders.

// One price, one tier: the book plus live directory access.
export const PRICE_USD = 99
// Shown struck through beside the price. Set to null to drop the discount display.
export const PRICE_WAS_USD: number | null = 150

// Checkout is still the existing Shopify product until Selar / Paystack / Stripe is decided.
export const CHECKOUT_URL = 'https://8kjjz9-ei.myshopify.com/products/landed'

export const SUPPORT_EMAIL = 'support@fayfort.com'
export const SOURCING_ENQUIRY_URL = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Sourcing enquiry')}`
export const INSTAGRAM_HANDLE = 'fayfort_international_trading'

// Shown in the FAQ only once written.
export const REFUND_ANSWER: string | null = null

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

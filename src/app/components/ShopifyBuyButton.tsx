import { ArrowRight } from 'lucide-react'

const SHOPIFY_PRODUCT_URL = 'https://8kjjz9-ei.myshopify.com/products/landed'

export default function ShopifyBuyButton() {
  return (
    <a
      className="button button-primary"
      href={SHOPIFY_PRODUCT_URL}
      target="_blank"
      rel="noreferrer"
    >
      Buy now <ArrowRight size={17} />
    </a>
  )
}

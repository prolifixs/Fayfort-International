'use client'

import { useCallback, useEffect, useRef } from 'react'

const SHOPIFY_SDK_URL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js'
const COMPONENT_ID = 'product-component-1788508122594'

type ShopifyUI = {
  createComponent: (type: string, configuration: Record<string, unknown>) => void
}

type ShopifyBuySdk = {
  buildClient: (configuration: { domain: string; storefrontAccessToken: string }) => unknown
  UI?: {
    onReady: (client: unknown) => Promise<ShopifyUI>
  }
}

declare global {
  interface Window {
    ShopifyBuy?: ShopifyBuySdk
  }
}

export default function ShopifyBuyButton() {
  const initialized = useRef(false)

  const initialize = useCallback(() => {
    if (initialized.current || !window.ShopifyBuy?.UI) return

    initialized.current = true
    const client = window.ShopifyBuy.buildClient({
      domain: '8kjjz9-ei.myshopify.com',
      storefrontAccessToken: 'ce77cfb8601f2c938066390f0fe3e51e',
    })

    window.ShopifyBuy.UI.onReady(client).then((ui) => {
      ui.createComponent('product', {
        id: '11224254382422',
        node: document.getElementById(COMPONENT_ID),
        moneyFormat: '{{amount_with_space_separator}} kr',
        options: {
          product: {
            styles: {
              product: {
                '@media (min-width: 601px)': {
                  maxWidth: 'calc(25% - 20px)',
                  marginLeft: '20px',
                  marginBottom: '50px',
                },
              },
            },
            buttonDestination: 'checkout',
            text: { button: 'Buy now' },
          },
          productSet: {
            styles: {
              products: {
                '@media (min-width: 601px)': { marginLeft: '-20px' },
              },
            },
          },
          modalProduct: {
            contents: {
              img: false,
              imgWithCarousel: true,
              button: false,
              buttonWithQuantity: true,
            },
            styles: {
              product: {
                '@media (min-width: 601px)': {
                  maxWidth: '100%',
                  marginLeft: '0px',
                  marginBottom: '0px',
                },
              },
            },
            text: { button: 'Add to cart' },
          },
          option: {},
          cart: { text: { total: 'Subtotal', button: 'Checkout' } },
          toggle: {},
        },
      })
    }).catch(() => {
      initialized.current = false
    })
  }, [])

  useEffect(() => {
    if (window.ShopifyBuy?.UI) {
      initialize()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${SHOPIFY_SDK_URL}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', initialize)
      return () => existingScript.removeEventListener('load', initialize)
    }

    const script = document.createElement('script')
    script.async = true
    script.src = SHOPIFY_SDK_URL
    script.addEventListener('load', initialize)
    document.head.appendChild(script)

    return () => script.removeEventListener('load', initialize)
  }, [initialize])

  return <div id={COMPONENT_ID} aria-label="Buy Landed now" />
}

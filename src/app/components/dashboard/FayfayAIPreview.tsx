import { Sparkles, Bot, X, MessageCircle, ShoppingCart, CreditCard, Truck, HelpCircle, Gift, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'


export function FayfayAIPreview() {
  const [showSidebar, setShowSidebar] = useState(false)

  const aiFeatures = [
    {
      icon: <MessageCircle className="h-6 w-6 text-blue-500" />,
      title: "WhatsApp Integration",
      description: "Connect with our AI assistant directly through WhatsApp for 24/7 support"
    },
    {
      icon: <ShoppingCart className="h-6 w-6 text-green-500" />,
      title: "Product Discovery",
      description: "Browse and search products, get recommendations, and check availability"
    },
    {
      icon: <CreditCard className="h-6 w-6 text-purple-500" />,
      title: "Payment Assistance",
      description: "Process payments, check status, and get invoice updates automatically"
    },
    {
      icon: <Truck className="h-6 w-6 text-orange-500" />,
      title: "Shipping Updates",
      description: "Track orders, get shipping quotes, and receive delivery notifications"
    },
    {
      icon: <HelpCircle className="h-6 w-6 text-indigo-500" />,
      title: "Instant Support",
      description: "Get answers to FAQs, product queries, and general assistance"
    },
    {
      icon: <Gift className="h-6 w-6 text-pink-500" />,
      title: "Promotions & Offers",
      description: "Stay updated with latest deals, discounts, and promotional offers"
    }
  ]

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900">Fayfay AI</h2>
          </div>
          <span className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
            Coming Soon
          </span>
        </div>
        
        <div className="text-center py-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 max-w-sm mx-auto">
            <Sparkles className="h-8 w-8 text-blue-500 mx-auto mb-4" />
            <h3 className="text-gray-900 font-medium mb-2">Your AI Assistant</h3>
            <p className="text-gray-600 text-sm">
              Get instant help with product inquiries, pricing, and order status
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => setShowSidebar(true)}
            className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <span>Learn More</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Fayfay AI Features</h2>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {aiFeatures.map((feature, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
} 
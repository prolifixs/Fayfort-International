'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { useAuth } from '@/contexts/AuthContext'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onTakeTour?: () => void
}

export function WelcomeModal({ isOpen, onClose, onTakeTour }: WelcomeModalProps) {
  const { user } = useAuth()
  const userName = user?.user_metadata?.name || 'there'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            👋 Welcome, {userName}!
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            Welcome to FayFort Enterprise, your one-stop platform for all your tech needs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Here's what you can do:</h4>
            <ul className="space-y-2 list-disc pl-4">
              <li>Browse our extensive catalog of tech products</li>
              <li>Make requests for specific items</li>
              <li>Track your orders in real-time</li>
              <li>Get notifications on order updates</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onTakeTour}
            disabled={true}
            className="flex-1"
          >
            Show me around
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { useToast } from "@/app/components/ui/use-toast"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function OrphanedActivityDialog({ 
  isOpen, 
  onClose, 
  activityId,
  onDeleted 
}: { 
  isOpen: boolean
  onClose: () => void
  activityId: string
  onDeleted: () => void
}) {
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('activity_log')
        .delete()
        .eq('id', activityId)

      if (error) throw error
      
      toast({
        title: "Activity Removed",
        description: "The orphaned activity has been cleaned up"
      })
      onDeleted()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove the activity",
        variant: "destructive",
      })
    } finally {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Orphaned Activity</DialogTitle>
          <DialogDescription>
            This invoice record no longer has an associated request. Would you like to remove it from your activity feed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Remove Activity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
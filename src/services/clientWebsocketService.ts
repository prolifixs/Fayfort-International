import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
export type RequestEvent = 'INSERT' | 'UPDATE' | 'DELETE'

interface WebsocketPayload {
  eventType: RequestEvent
  new: any
  old: any
}

interface WebsocketConfig {
  table: string
  filter?: string
  onUpdate: (payload: WebsocketPayload) => void
}

class ClientWebsocketService {
  private supabase = createClientComponentClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private connectionStatus: ConnectionStatus = 'disconnected'
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set()

  subscribeToStatus(callback: (status: ConnectionStatus) => void) {
    this.statusListeners.add(callback)
    callback(this.connectionStatus)
    
    return () => {
      this.statusListeners.delete(callback)
    }
  }

  private updateStatus(status: ConnectionStatus) {
    this.connectionStatus = status
    this.statusListeners.forEach(listener => listener(status))
  }

  async subscribeToRequests({ table, filter, onUpdate }: WebsocketConfig) {
    try {
      this.updateStatus('connecting')
      
      const channel = this.supabase
        .channel(`client_${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter
          },
          (payload) => {
            const eventType = payload.eventType as RequestEvent
            console.log(`ClientWebsocketService - ${table} update:`, payload)
            onUpdate({ eventType, new: payload.new, old: payload.old })
          }
        )
        .subscribe((status) => {
          console.log(`ClientWebsocketService - Channel status:`, status)
          this.updateStatus(status === 'SUBSCRIBED' ? 'connected' : 'error')
        })

      this.channels.set(table, channel)
      return () => this.unsubscribe(table)
    } catch (error) {
      console.error('ClientWebsocketService - Subscription error:', error)
      this.updateStatus('error')
      throw error
    }
  }

  private unsubscribe(table: string) {
    const channel = this.channels.get(table)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(table)
    }
  }

  cleanup() {
    this.channels.forEach((channel, table) => {
      this.unsubscribe(table)
    })
    this.statusListeners.clear()
  }
}

export const clientWebsocketService = new ClientWebsocketService() 
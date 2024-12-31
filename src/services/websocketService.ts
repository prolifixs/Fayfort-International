import { RequestStatus } from "./statusService";

interface WebSocketMessage {
  type: string;
  payload: Request;
}

interface Request {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
}

type WebSocketCallback = (data: Request) => void;

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, WebSocketCallback[]> = new Map();
  private statusSubscribers: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  connect(url: string = 'ws://localhost:3000') {
    this.updateStatus('connecting');
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    };

    this.ws.onclose = () => {
      this.updateStatus('disconnected');
      if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(url);
        }, 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketMessage;
      const subscribers = this.subscribers.get(data.type) || [];
      subscribers.forEach(callback => callback(data.payload));
    };
  }

  private updateStatus(status: ConnectionStatus) {
    this.statusSubscribers.forEach(callback => callback(status));
  }

  subscribeToStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.statusSubscribers.push(callback);
    return () => {
      this.statusSubscribers = this.statusSubscribers.filter(cb => cb !== callback);
    };
  }

  subscribe(type: string, callback: WebSocketCallback): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }
    this.subscribers.get(type)?.push(callback);

    return () => {
      const callbacks = this.subscribers.get(type) || [];
      this.subscribers.set(type, callbacks.filter(cb => cb !== callback));
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = 0;
  }
}

export const websocketService = new WebSocketService(); 
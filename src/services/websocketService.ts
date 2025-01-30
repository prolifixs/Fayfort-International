import { RequestStatus } from "./statusService";

interface WebSocketMessage {
  type: string;
  payload: Request;
  id: string;
  timestamp: number;
}

interface Request {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
}

type WebSocketCallback = (data: Request) => void;

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, WebSocketCallback[]> = new Map();
  private statusSubscribers: ((status: ConnectionStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private messageQueue: WebSocketMessage[] = [];
  private lastHeartbeat: number = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  connect(url: string = 'ws://localhost:3000') {
    this.updateStatus('connecting');
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
      this.startHeartbeat();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  private handleOpen() {
    this.reconnectAttempts = 0;
    this.updateStatus('connected');
    this.processMessageQueue();
  }

  private handleClose() {
    this.updateStatus('disconnected');
    this.attemptReconnection();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      this.lastHeartbeat = Date.now();
      
      if (data.type === 'heartbeat') return;
      
      const subscribers = this.subscribers.get(data.type) || [];
      subscribers.forEach(callback => callback(data.payload));
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.updateStatus('disconnected');
  }

  private attemptReconnection() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.updateStatus('reconnecting');
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.getReconnectDelay());
    }
  }

  private getReconnectDelay(): number {
    return Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (Date.now() - this.lastHeartbeat > 30000) {
        this.handleHeartbeatTimeout();
      }
    }, 30000);
  }

  private handleHeartbeatTimeout() {
    this.disconnect();
    this.connect();
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  sendMessage(message: WebSocketMessage) {
    if (!this.isConnected()) {
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws?.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push(message);
    }
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.updateStatus('disconnected');
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

  private handleConnectionError(error: unknown) {
    console.error('WebSocket connection error:', error);
    this.updateStatus('disconnected');
    this.attemptReconnection();
  }
}

export const websocketService = new WebSocketService(); 
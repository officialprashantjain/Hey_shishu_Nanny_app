/**
 * src/services/socketService.js
 * Singleton Socket.IO Client Manager for Real-Time Chat & State Synchronization
 */

import { io } from 'socket.io-client';
import { getSession } from '../utils/storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.listeners = new Map();
  }

  /**
   * Derive the base Socket URL from EXPO_PUBLIC_API_BASE_URL
   */
  getSocketUrl() {
    const rawUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    return rawUrl.replace(/\/api\/v1\/?$/, '');
  }

  /**
   * Connect to Socket.IO server with JWT authentication
   */
  async connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    this.isConnecting = true;

    try {
      const session = await getSession();
      const token = session?.token;

      if (!token) {
        console.warn('[SocketService] Cannot connect: No auth token found.');
        this.isConnecting = false;
        return null;
      }

      const socketUrl = this.getSocketUrl();

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log(`✅ [SocketService] Connected to ${socketUrl} | ID: ${this.socket.id}`);
        this.isConnecting = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`🔌 [SocketService] Disconnected. Reason: ${reason}`);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[SocketService] Connection error:', err.message);
        this.isConnecting = false;
      });

      return this.socket;
    } catch (err) {
      console.error('[SocketService] Connection exception:', err);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Disconnect the active socket session
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      console.log('🔌 [SocketService] Disconnected manually.');
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event, payload = {}, callback) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`[SocketService] Cannot emit '${event}': Socket not connected. Attempting reconnect...`);
      this.connect().then(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit(event, payload, callback);
        }
      });
      return false;
    }

    this.socket.emit(event, payload, callback);
    return true;
  }

  /**
   * Register an event listener
   */
  on(event, handler) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unregister an event listener
   */
  off(event, handler) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  /**
   * Check connection status
   */
  isConnected() {
    return Boolean(this.socket && this.socket.connected);
  }

  /**
   * Get raw socket instance
   */
  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;

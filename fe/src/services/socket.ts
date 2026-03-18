import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../constants/config';
import { useAuthStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;
    
    this.socket = io(CONFIG.SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinMovieRoom(movieId: string) {
    if (this.socket) {
      this.socket.emit('joinRoom', { movieId });
    }
  }

  leaveMovieRoom(movieId: string) {
    if (this.socket) {
      this.socket.emit('leaveRoom', { movieId });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();

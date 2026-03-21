import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../constants/config';
import { useAuthStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;

    const token = useAuthStore.getState().token;
    this.socket = io(CONFIG.SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: token ? { token } : undefined,
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
      this.socket.emit('comments:join', movieId);
    }
  }

  leaveMovieRoom(movieId: string) {
    if (this.socket) {
      this.socket.emit('comments:leave', movieId);
    }
  }

  joinNotifications(userId: string) {
    if (this.socket) {
      this.socket.emit('notifications:join', userId);
    }
  }

  leaveNotifications(userId: string) {
    if (this.socket) {
      this.socket.emit('notifications:leave', userId);
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

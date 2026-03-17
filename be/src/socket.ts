import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('comments:join', (movieId: string) => {
      socket.join(`movie:${movieId}`);
    });

    socket.on('comments:leave', (movieId: string) => {
      socket.leave(`movie:${movieId}`);
    });
  });

  return io;
};

export const getIO = () => io;

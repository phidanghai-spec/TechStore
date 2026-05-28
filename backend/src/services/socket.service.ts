import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from './prisma.service';

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static init(httpServer: HTTPServer, frontendUrl: string): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [frontendUrl, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    console.log('Socket.io initialized.');

    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // User joins their personal chat room
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room: ${roomId}`);
      });

      // Handle message sending
      socket.on('send_message', async (data: {
        senderId: string;
        receiverId: string;
        message: string;
        roomId: string;
      }) => {
        const { senderId, receiverId, message, roomId } = data;
        
        try {
          // Save message to database
          const savedMessage = await prisma.chatMessage.create({
            data: {
              senderId,
              receiverId,
              message,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                  role: true,
                }
              }
            }
          });

          // Broadcast message to room
          this.io?.to(roomId).emit('receive_message', savedMessage);
          
          // Notify admin of new message globally (for dashboard notifications)
          this.io?.emit('new_message_notification', {
            roomId,
            message: savedMessage,
          });

        } catch (error) {
          console.error('Error saving chat message:', error);
          socket.emit('error', 'Không thể gửi tin nhắn');
        }
      });

      // Handle typing indicator
      socket.on('typing', (data: { roomId: string; isTyping: boolean; senderName: string }) => {
        const { roomId, isTyping, senderName } = data;
        socket.to(roomId).emit('typing_status', { isTyping, senderName });
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  public static getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io has not been initialized.');
    }
    return this.io;
  }
}

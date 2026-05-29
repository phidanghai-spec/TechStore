import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import prisma from './prisma.service';

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static init(httpServer: HTTPServer, frontendUrl: string): SocketIOServer {
    const allowedOrigins = [frontendUrl, 'http://localhost:3000'];

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          
          const isAllowed = allowedOrigins.some(o => 
            origin === o || 
            (o.includes('vercel.app') && origin.endsWith('.vercel.app')) ||
            (origin.includes('vercel.app') && origin.endsWith('vercel.app'))
          );

          if (isAllowed || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
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
        senderName?: string;
        senderEmail?: string;
        receiverId: string;
        message: string;
        roomId: string;
      }) => {
        let { senderId, senderName, senderEmail, receiverId, message, roomId } = data;
        
        try {
          // 1. Resolve Admin receiver if it is a placeholder
          if (receiverId === 'admin_placeholder') {
            const admin = await prisma.user.findFirst({
              where: { role: 'ADMIN' }
            });
            if (admin) {
              receiverId = admin.id;
            } else {
              throw new Error('Admin user not found in database');
            }
          }

          // 2. Resolve Sender ID (find or create guest user if it doesn't exist)
          let actualSenderId = senderId;
          const senderExists = await prisma.user.findUnique({
            where: { id: senderId }
          });

          if (!senderExists) {
            const guestEmail = senderEmail || (senderId.includes('@') ? senderId : 'guest@techstore.vn');
            const guestName = senderName || 'Khách vãng lai';
            
            let guestUser = await prisma.user.findUnique({
              where: { email: guestEmail }
            });
            
            if (!guestUser) {
              const bcrypt = require('bcrypt');
              const dummyPassword = await bcrypt.hash('guest_temp_123', 10);
              guestUser = await prisma.user.create({
                data: {
                  email: guestEmail,
                  fullName: guestName + ' (Khách)',
                  phone: '0000000000',
                  password: dummyPassword,
                  address: 'Khách vãng lai (Chat)',
                  dob: new Date('2000-01-01'),
                  role: 'CUSTOMER',
                  rank: 'SILVER',
                  deposit: 0
                }
              });
            }
            actualSenderId = guestUser.id;
          }

          // 3. Resolve Receiver ID if it is a guest email or doesn't exist
          let actualReceiverId = receiverId;
          const receiverExists = await prisma.user.findUnique({
            where: { id: receiverId }
          });
          if (!receiverExists) {
            const receiverUser = await prisma.user.findUnique({
              where: { email: receiverId }
            });
            if (receiverUser) {
              actualReceiverId = receiverUser.id;
            }
          }

          // Save message to database
          const savedMessage = await prisma.chatMessage.create({
            data: {
              senderId: actualSenderId,
              receiverId: actualReceiverId,
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

          // 4. Auto Responder for Customers
          const isCustomer = savedMessage.sender.role === 'CUSTOMER';
          if (isCustomer) {
            // Check if there's only 1 customer message in this chat or if we just respond instantly
            setTimeout(async () => {
              try {
                const admin = await prisma.user.findFirst({
                  where: { role: 'ADMIN' },
                  select: { id: true, fullName: true, role: true }
                });
                
                if (admin) {
                  const autoReplyText = "Cảm ơn bạn đã liên hệ với TechStore! Bộ phận Chăm sóc khách hàng đã nhận được tin nhắn và sẽ phản hồi bạn trong giây lát. Vui lòng đợi trong giây lát nhé! 😊";
                  
                  const savedAutoReply = await prisma.chatMessage.create({
                    data: {
                      senderId: admin.id,
                      receiverId: actualSenderId,
                      message: autoReplyText,
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
                  
                  // Broadcast to room
                  this.io?.to(roomId).emit('receive_message', savedAutoReply);
                  
                  // Notify admin dashboard
                  this.io?.emit('new_message_notification', {
                    roomId,
                    message: savedAutoReply,
                  });
                }
              } catch (err) {
                console.error('Error sending auto-reply:', err);
              }
            }, 1000); // 1 second delay
          }

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

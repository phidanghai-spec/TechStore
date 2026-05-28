import { Response } from 'express';
import prisma from '../services/prisma.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ChatController {
  /**
   * Khách hàng lấy lịch sử chat với Admin
   */
  public static async getChatHistory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id!;

    try {
      // Find the admin user first
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      if (!admin) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản hỗ trợ trực tuyến của shop.' });
      }

      const adminId = admin.id;

      // Get all messages between userId and adminId
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: adminId },
            { senderId: adminId, receiverId: userId }
          ]
        },
        include: {
          sender: {
            select: {
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return res.status(200).json(messages);

    } catch (error) {
      console.error('Get chat history error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tải lịch sử tin nhắn.' });
    }
  }

  /**
   * Admin lấy danh sách tất cả cuộc hội thoại của các khách hàng (Chat List)
   */
  public static async getAdminChatList(req: AuthenticatedRequest, res: Response) {
    try {
      // Find all unique users who sent/received messages and are not admin
      const messages = await prisma.chatMessage.findMany({
        include: {
          sender: {
            select: { id: true, fullName: true, email: true, role: true }
          },
          receiver: {
            select: { id: true, fullName: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Extract unique customers
      const conversationsMap = new Map<string, {
        userId: string;
        fullName: string;
        email: string;
        lastMessage: string;
        lastMessageAt: Date;
      }>();

      for (const msg of messages) {
        const customer = msg.sender.role === 'CUSTOMER' ? msg.sender : msg.receiver.role === 'CUSTOMER' ? msg.receiver : null;
        if (!customer) continue;

        if (!conversationsMap.has(customer.id)) {
          conversationsMap.set(customer.id, {
            userId: customer.id,
            fullName: customer.fullName,
            email: customer.email,
            lastMessage: msg.message,
            lastMessageAt: msg.createdAt
          });
        }
      }

      const conversations = Array.from(conversationsMap.values());
      return res.status(200).json(conversations);

    } catch (error) {
      console.error('Get admin chat list error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách hội thoại.' });
    }
  }

  /**
   * Admin lấy lịch sử chat với một khách hàng cụ thể
   */
  public static async getChatHistoryForAdmin(req: AuthenticatedRequest, res: Response) {
    const { customerId } = req.params;
    const adminId = req.user?.id!;

    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: customerId, receiverId: adminId },
            { senderId: adminId, receiverId: customerId }
          ]
        },
        include: {
          sender: {
            select: {
              fullName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return res.status(200).json(messages);

    } catch (error) {
      console.error('Get chat history for admin error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tải lịch sử nhắn tin của khách.' });
    }
  }
}

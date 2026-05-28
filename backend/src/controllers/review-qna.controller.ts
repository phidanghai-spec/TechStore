import { Response } from 'express';
import prisma from '../services/prisma.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ReviewQnaController {
  /**
   * Đánh giá sản phẩm đã mua
   */
  public static async createReview(req: AuthenticatedRequest, res: Response) {
    const { productId, rating, comment } = req.body;
    const userId = req.user?.id!;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Vui lòng cung cấp sản phẩm, số sao và nội dung đánh giá.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Số sao đánh giá phải từ 1 đến 5.' });
    }

    try {
      // Check if user has purchased the product and order is DELIVERED
      const deliveredOrder = await prisma.order.findFirst({
        where: {
          userId,
          orderStatus: 'DELIVERED',
          items: {
            some: {
              productId
            }
          }
        }
      });

      if (!deliveredOrder) {
        return res.status(403).json({ 
          message: 'Bạn chỉ có thể đánh giá những sản phẩm đã mua và đã được giao hàng thành công.' 
        });
      }

      // Check if already reviewed
      const existingReview = await prisma.productReview.findFirst({
        where: {
          userId,
          productId
        }
      });

      if (existingReview) {
        return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này trước đó.' });
      }

      // Create review
      const review = await prisma.productReview.create({
        data: {
          userId,
          productId,
          rating: parseInt(rating),
          comment,
          isApproved: true // Mặc định duyệt tự động (admin có thể ẩn/xóa sau)
        }
      });

      return res.status(201).json({
        message: 'Đăng đánh giá thành công. Cảm ơn bạn!',
        review
      });

    } catch (error) {
      console.error('Create review error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi gửi đánh giá.' });
    }
  }

  /**
   * Tạo câu hỏi hỏi đáp sản phẩm
   */
  public static async createQna(req: AuthenticatedRequest, res: Response) {
    const { productId, question } = req.body;
    const userId = req.user?.id!;

    if (!productId || !question) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ID sản phẩm và câu hỏi.' });
    }

    try {
      const qna = await prisma.productQna.create({
        data: {
          userId,
          productId,
          question,
          isApproved: true // Mặc định hiển thị, admin sẽ duyệt/trả lời sau
        }
      });

      return res.status(201).json({
        message: 'Gửi câu hỏi hỏi đáp thành công. Chúng tôi sẽ phản hồi sớm nhất.',
        qna
      });

    } catch (error) {
      console.error('Create QnA error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi gửi câu hỏi.' });
    }
  }
}

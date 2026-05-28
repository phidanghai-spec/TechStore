import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export class WarrantyController {
  /**
   * Tra cứu bảo hành công khai bằng Số điện thoại hoặc Mã bảo hành (cho Khách vãng lai & Khách hàng)
   */
  public static async trackWarranty(req: Request, res: Response) {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã bảo hành hoặc số điện thoại để tra cứu.' });
    }

    try {
      const warranties = await prisma.warranty.findMany({
        where: {
          OR: [
            { warrantyCode: query as string },
            { customerPhone: query as string }
          ]
        },
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
              brand: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(warranties);
    } catch (error) {
      console.error('Track warranty error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tra cứu bảo hành.' });
    }
  }

  /**
   * Khách hàng lấy danh sách bảo hành cá nhân
   */
  public static async getMyWarranties(req: any, res: Response) {
    const userId = req.user?.id;

    try {
      const warranties = await prisma.warranty.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
              brand: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(warranties);
    } catch (error) {
      console.error('Get my warranties error:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách bảo hành.' });
    }
  }

  /**
   * Admin lấy danh sách bảo hành toàn hệ thống
   */
  public static async getWarranties(req: Request, res: Response) {
    const { status, query } = req.query;

    try {
      const where: any = {};

      if (status) {
        where.status = status as any;
      }

      if (query) {
        where.OR = [
          { warrantyCode: { contains: query as string } },
          { customerPhone: { contains: query as string } },
          { customerName: { contains: query as string } }
        ];
      }

      const warranties = await prisma.warranty.findMany({
        where,
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(warranties);
    } catch (error) {
      console.error('Admin get warranties error:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách bảo hành.' });
    }
  }

  /**
   * Admin cập nhật trạng thái sửa chữa, ghi chú bảo hành
   */
  public static async updateWarrantyStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, notes } = req.body;

    try {
      const warranty = await prisma.warranty.update({
        where: { id },
        data: {
          status,
          notes
        }
      });

      return res.status(200).json({ message: 'Cập nhật thông tin bảo hành thành công.', warranty });
    } catch (error) {
      console.error('Update warranty error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật bảo hành.' });
    }
  }
}

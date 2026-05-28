import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export class ProductController {
  /**
   * Lấy danh sách danh mục
   */
  public static async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany();
      return res.status(200).json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách danh mục.' });
    }
  }

  /**
   * Lấy danh sách sản phẩm kèm lọc nâng cao
   */
  public static async getProducts(req: Request, res: Response) {
    const { 
      category, 
      brand, 
      minPrice, 
      maxPrice, 
      status, 
      search, 
      ram, 
      storage,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    try {
      // Build filters
      const where: any = {
        isVisible: true,
        stock: { gt: 0 } // Bắt buộc: Không hiển thị sản phẩm có số lượng = 0 (trừ trường hợp cụ thể)
      };

      if (category) {
        where.category = {
          slug: category as string
        };
      }

      if (brand) {
        where.brand = {
          equals: brand as string,
          mode: 'insensitive'
        };
      }

      if (status) {
        where.status = status as any;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { tags: { contains: search as string, mode: 'insensitive' } },
          { brand: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (minPrice || maxPrice) {
        where.salePrice = {};
        if (minPrice) where.salePrice.gte = parseFloat(minPrice as string);
        if (maxPrice) where.salePrice.lte = parseFloat(maxPrice as string);
      }

      // Query database
      // Lưu ý: Nếu có yêu cầu lọc RAM, Storage nằm trong JSON string `description`,
      // cách tốt nhất cho tập dữ liệu nhỏ (75 sản phẩm) là lấy hết sản phẩm thoả mãn điều kiện thô trước,
      // sau đó filter thủ công bằng JavaScript và phân trang thủ công.
      
      const allMatchingProducts = await prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: {
            where: { isApproved: true },
            select: { rating: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filter by RAM and Storage in memory (since description is JSON text)
      let filteredProducts = allMatchingProducts;

      if (ram || storage) {
        filteredProducts = allMatchingProducts.filter(product => {
          try {
            const descObj = JSON.parse(product.description);
            let matchesRam = true;
            let matchesStorage = true;

            if (ram) {
              const cleanRamQuery = (ram as string).replace(/\s+/g, '').toLowerCase();
              const productRam = descObj.ram ? descObj.ram.replace(/\s+/g, '').toLowerCase() : '';
              matchesRam = productRam.includes(cleanRamQuery);
            }

            if (storage) {
              const cleanStorageQuery = (storage as string).replace(/\s+/g, '').toLowerCase();
              const productStorage = descObj.storage ? descObj.storage.replace(/\s+/g, '').toLowerCase() : '';
              matchesStorage = productStorage.includes(cleanStorageQuery);
            }

            return matchesRam && matchesStorage;
          } catch (e) {
            return false;
          }
        });
      }

      // Calculate pagination
      const totalItems = filteredProducts.length;
      const totalPages = Math.ceil(totalItems / limitNum);
      const paginatedProducts = filteredProducts.slice(skip, skip + limitNum);

      // Map average ratings
      const productsWithRating = paginatedProducts.map(p => {
        const ratingsCount = p.reviews.length;
        const avgRating = ratingsCount > 0 
          ? p.reviews.reduce((acc, curr) => acc + curr.rating, 0) / ratingsCount
          : 5; // Mặc định 5 sao nếu chưa có đánh giá
        
        // Remove reviews list to keep response lightweight
        const { reviews, ...prodData } = p;
        return {
          ...prodData,
          avgRating,
          ratingsCount
        };
      });

      return res.status(200).json({
        products: productsWithRating,
        pagination: {
          totalItems,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      });

    } catch (error) {
      console.error('Get products error:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách sản phẩm.' });
    }
  }

  /**
   * Chi tiết sản phẩm qua slug (Đồng bộ cho URL thân thiện)
   */
  public static async getProductBySlug(req: Request, res: Response) {
    const { slug } = req.params;

    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          reviews: {
            where: { isApproved: true },
            include: {
              user: {
                select: {
                  fullName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          qnas: {
            where: { isApproved: true },
            include: {
              user: {
                select: {
                  fullName: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
      }

      // Calculate rating
      const ratingsCount = product.reviews.length;
      const avgRating = ratingsCount > 0
        ? product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / ratingsCount
        : 5;

      return res.status(200).json({
        ...product,
        avgRating,
        ratingsCount
      });

    } catch (error) {
      console.error('Get product detail error:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm.' });
    }
  }
}

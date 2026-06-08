import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export class ProductController {
  /**
   * Lấy danh sách danh mục
   */
  public static async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany();
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
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
        AND: [
          {
            OR: [
              { stock: { gt: 0 } },
              { status: 'HOT' }
            ]
          }
        ]
      };

      if (category) {
        where.category = {
          slug: category as string
        };
      }

      if (brand) {
        where.brand = {
          equals: brand as string
        };
      }

      if (status) {
        where.status = status as any;
      }

      if (minPrice || maxPrice) {
        where.salePrice = {};
        if (minPrice) where.salePrice.gte = parseFloat(minPrice as string);
        if (maxPrice) where.salePrice.lte = parseFloat(maxPrice as string);
      }

      if (search) {
        const cleanSearch = (search as string).trim();
        where.AND.push({
          OR: [
            { name: { contains: cleanSearch } },
            { brand: { contains: cleanSearch } },
            { tags: { contains: cleanSearch } },
            { description: { contains: cleanSearch } }
          ]
        });
      }

      // Query database
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

      // Filter by Search (accentless), RAM and Storage in memory
      let filteredProducts = allMatchingProducts;

      if (search) {
        const keywords = removeVietnameseTones(search as string)
          .split(/\s+/)
          .filter(word => word.length > 0);

        filteredProducts = filteredProducts.filter(product => {
          const name = removeVietnameseTones(product.name);
          const prBrand = removeVietnameseTones(product.brand);
          const description = removeVietnameseTones(product.description);
          const tags = removeVietnameseTones(product.tags || '');
          const categoryName = removeVietnameseTones(product.category?.name || '');

          return keywords.every(keyword => 
            name.includes(keyword) ||
            prBrand.includes(keyword) ||
            description.includes(keyword) ||
            tags.includes(keyword) ||
            categoryName.includes(keyword)
          );
        });
      }

      if (ram || storage) {
        filteredProducts = filteredProducts.filter(product => {
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
          : 0; // Mặc định 0 sao nếu chưa có đánh giá
        
        // Remove reviews list to keep response lightweight
        const { reviews, ...prodData } = p;
        return {
          ...prodData,
          avgRating,
          ratingsCount
        };
      });

      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=60');
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
        : 0; // Mặc định 0 sao nếu chưa có đánh giá

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

  /**
   * API gợi ý tìm kiếm (autocomplete)
   * GET /api/products/suggestions?q=keyword
   */
  public static async getSuggestions(req: Request, res: Response) {
    const { q } = req.query;
    if (!q || (q as string).trim().length < 2) {
      return res.status(200).json([]);
    }
    const keyword = (q as string).trim();

    try {
      const products = await prisma.product.findMany({
        where: {
          isVisible: true,
          OR: [
            { stock: { gt: 0 } },
            { status: 'HOT' }
          ]
        },
        include: {
          category: true
        }
      });

      const keywords = removeVietnameseTones(keyword)
        .split(/\s+/)
        .filter(word => word.length > 0);

      const matchedProducts = products.filter(product => {
        const name = removeVietnameseTones(product.name);
        const prBrand = removeVietnameseTones(product.brand);
        const description = removeVietnameseTones(product.description);
        const tags = removeVietnameseTones(product.tags || '');
        const categoryName = removeVietnameseTones(product.category?.name || '');

        return keywords.every(kw => 
          name.includes(kw) ||
          prBrand.includes(kw) ||
          description.includes(kw) ||
          tags.includes(kw) ||
          categoryName.includes(kw)
        );
      }).slice(0, 5);

      const suggestions = matchedProducts.map(p => {
        const discountPercent = p.originalPrice > p.salePrice 
          ? Math.round(((p.originalPrice - p.salePrice) / p.originalPrice) * 100) 
          : 0;
        const discountAmount = Math.round(p.originalPrice * (discountPercent / 100));
        const finalPrice = discountPercent > 0 ? p.originalPrice - discountAmount : p.salePrice;

        return {
          id: p.id,
          name: p.name,
          price: finalPrice,
          image: p.imageUrl,
          category: p.category.name,
          slug: p.slug
        };
      });

      return res.status(200).json(suggestions);
    } catch (error) {
      console.error('Get suggestions error:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ khi lấy gợi ý.' });
    }
  }
}

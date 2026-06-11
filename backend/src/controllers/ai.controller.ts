import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../services/prisma.service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// System prompt cố định cho TechStore AI Assistant
const SYSTEM_PROMPT = `Bạn là TechBot - trợ lý AI thông minh của TechStore, một cửa hàng điện tử chuyên kinh doanh điện thoại, laptop và phụ kiện công nghệ tại Việt Nam.

## VAI TRÒ CỦA BẠN:
- Tư vấn sản phẩm phù hợp với nhu cầu và ngân sách khách hàng
- Giải đáp thắc mắc về sản phẩm, chính sách bảo hành, vận chuyển
- So sánh sản phẩm một cách khách quan và trung thực
- Hỗ trợ khách hàng trong quá trình mua hàng

## NGUYÊN TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Sử dụng thông tin sản phẩm được cung cấp trong context để tư vấn chính xác
- Nếu không có thông tin về sản phẩm khách hỏi, nói thật và gợi ý liên hệ admin
- Định dạng giá tiền theo kiểu Việt Nam (VD: 25.990.000đ)
- Nếu khách hỏi về đơn hàng cụ thể hoặc tài khoản, hướng dẫn liên hệ admin qua chat trực tiếp
- Không bịa đặt thông tin sản phẩm nếu không có trong database

## CHÍNH SÁCH TECHSTORE:
- Bảo hành chính hãng 12-24 tháng tùy sản phẩm
- Đổi trả trong 7 ngày nếu có lỗi kỹ thuật
- Giao hàng toàn quốc, miễn phí đơn từ 500.000đ
- Thanh toán: COD, Momo, Paypal
- Tích điểm thành viên: 1đ chi tiêu = 1 điểm
- Hạng thành viên: Bạc (0-9,999 điểm), Vàng (10,000-49,999), Bạch Kim (50,000+)`;

/**
 * Lấy top sản phẩm liên quan từ DB dựa trên câu hỏi
 */
async function getRelevantProducts(query: string): Promise<string> {
  try {
    // Extract keywords from query
    const keywords = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Tìm sản phẩm theo các từ khóa trong tên, brand, tags, description
    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
        OR: keywords.length > 0 ? [
          ...keywords.map(kw => ({ name: { contains: kw } })),
          ...keywords.map(kw => ({ brand: { contains: kw } })),
          ...keywords.map(kw => ({ tags: { contains: kw } })),
        ] : undefined
      },
      include: {
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    });

    // Nếu không tìm theo keyword, lấy sản phẩm HOT/BEST_SELLER
    if (products.length === 0) {
      const hotProducts = await prisma.product.findMany({
        where: {
          isVisible: true,
          status: { in: ['HOT', 'BEST_SELLER'] }
        },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8
      });
      
      if (hotProducts.length === 0) return 'Hiện chưa có sản phẩm phù hợp trong database.';
      
      return formatProductsContext(hotProducts);
    }

    return formatProductsContext(products);
  } catch (error) {
    console.error('Error fetching products for RAG:', error);
    return '';
  }
}

function formatProductsContext(products: any[]): string {
  return products.map(p => {
    const salePriceFormatted = new Intl.NumberFormat('vi-VN').format(p.salePrice);
    const origPriceFormatted = new Intl.NumberFormat('vi-VN').format(p.originalPrice);
    const discount = p.originalPrice > p.salePrice 
      ? `(Giảm ${Math.round((1 - p.salePrice / p.originalPrice) * 100)}% từ ${origPriceFormatted}đ)`
      : '';
    
    return `- **${p.name}** | Hãng: ${p.brand} | Danh mục: ${p.category?.name}
  Giá bán: ${salePriceFormatted}đ ${discount}
  Kho: ${p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng'} | Trạng thái: ${p.status}
  Tags: ${p.tags || 'N/A'}
  Đường dẫn: /san-pham/${p.slug}`;
  }).join('\n\n');
}

export class AiController {
  /**
   * RAG Chat với Claude AI
   * POST /api/ai/chat
   */
  public static async chat(req: Request, res: Response) {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp nội dung tin nhắn.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ 
        message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng chat với admin để được hỗ trợ.' 
      });
    }

    try {
      // Step 1: Retrieve relevant products (RAG)
      const productContext = await getRelevantProducts(message.trim());

      // Step 2: Build conversation history for Claude
      const systemPromptWithContext = `${SYSTEM_PROMPT}

## SẢN PHẨM HIỆN CÓ TRONG KHO (cập nhật thực tế):
${productContext || 'Không tìm thấy sản phẩm phù hợp trong database hiện tại.'}

---
Hãy tư vấn dựa trên thông tin sản phẩm trên. Nếu khách hỏi về sản phẩm không có trong danh sách, hãy thành thật và đề nghị khách liên hệ trực tiếp.`;

      // Build messages array from conversation history
      const messages: Anthropic.MessageParam[] = [];
      
      // Add conversation history (last 10 messages to avoid token limits)
      if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10);
        for (const hist of recentHistory) {
          if (hist.role === 'user' || hist.role === 'assistant') {
            messages.push({
              role: hist.role,
              content: hist.content
            });
          }
        }
      }

      // Add current message
      messages.push({
        role: 'user',
        content: message.trim()
      });

      // Step 3: Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Nhanh và rẻ nhất, đủ dùng cho chatbot
        max_tokens: 1024,
        system: systemPromptWithContext,
        messages
      });

      const aiReply = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Xin lỗi, tôi không thể xử lý yêu cầu này.';

      return res.status(200).json({
        reply: aiReply,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      });

    } catch (error: any) {
      console.error('Claude AI chat error:', error);
      
      if (error?.status === 401) {
        return res.status(503).json({ 
          message: 'API key AI không hợp lệ. Vui lòng liên hệ admin.' 
        });
      }
      
      if (error?.status === 529 || error?.status === 503) {
        return res.status(503).json({ 
          message: 'Dịch vụ AI đang bận. Vui lòng thử lại sau hoặc chat trực tiếp với admin.' 
        });
      }

      return res.status(500).json({ 
        message: 'Đã xảy ra lỗi khi kết nối AI. Vui lòng thử lại.' 
      });
    }
  }

  /**
   * Lấy danh sách sản phẩm gợi ý cho AI context (debug endpoint)
   * GET /api/ai/products-context?q=iphone
   */
  public static async getProductsContext(req: Request, res: Response) {
    const query = (req.query.q as string) || '';
    const context = await getRelevantProducts(query);
    return res.status(200).json({ context });
  }
}

import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '../services/prisma.service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
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
    const keywords = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const products = await prisma.product.findMany({
      where: {
        isVisible: true,
        OR: keywords.length > 0 ? [
          ...keywords.map(kw => ({ name: { contains: kw } })),
          ...keywords.map(kw => ({ brand: { contains: kw } })),
          ...keywords.map(kw => ({ tags: { contains: kw } })),
          ...keywords.map(kw => ({ description: { contains: kw } }))
        ] : undefined
      },
      include: {
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    });

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

/**
 * Trả lời thông minh từ CSDL khi không có Claude API Key hoặc API bận
 */
async function generateSmartFallbackAnswer(query: string): Promise<string> {
  const cleanQuery = query.toLowerCase().trim();

  // 1. Hỏi đáp chính sách
  if (cleanQuery.includes('bảo hành') || cleanQuery.includes('bao hanh')) {
    return `🛡️ **Chính sách bảo hành tại TechStore:**\n- Sản phẩm chính hãng bảo hành từ 12 - 24 tháng.\n- Đổi mới 1-1 trong 30 ngày nếu có lỗi từ nhà sản xuất.\n- Bạn có thể tra cứu bảo hành ngay tại trang chủ bằng SĐT hoặc Mã bảo hành (BH-XXXX).`;
  }
  if (cleanQuery.includes('giao hàng') || cleanQuery.includes('vận chuyển') || cleanQuery.includes('ship')) {
    return `✈️ **Chính sách giao hàng TechStore:**\n- Giao hàng hỏa tốc trong 2h tại nội thành TP.HCM.\n- Miễn phí giao hàng toàn quốc cho đơn từ 500.000đ.\n- Hỗ trợ kiểm tra hàng trước khi thanh toán (COD).`;
  }
  if (cleanQuery.includes('thanh toán') || cleanQuery.includes('momo') || cleanQuery.includes('paypal')) {
    return `💳 **Phương thức thanh toán hỗ trợ:**\n- Thanh toán khi nhận hàng (COD).\n- Thanh toán qua ví MoMo QR.\n- Thanh toán thẻ quốc tế qua PayPal.\n- Chiết khấu thêm cho hội viên: Vàng (-2%), Bạch Kim (-5%).`;
  }

  // 2. Tìm kiếm sản phẩm phù hợp từ DB
  const keywords = cleanQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const matchedProducts = await prisma.product.findMany({
    where: {
      isVisible: true,
      OR: keywords.length > 0 ? [
        ...keywords.map(kw => ({ name: { contains: kw } })),
        ...keywords.map(kw => ({ brand: { contains: kw } })),
        ...keywords.map(kw => ({ tags: { contains: kw } })),
        ...keywords.map(kw => ({ description: { contains: kw } }))
      ] : undefined
    },
    include: { category: { select: { name: true } } },
    take: 4
  });

  const productsToDisplay = matchedProducts.length > 0 ? matchedProducts : await prisma.product.findMany({
    where: { isVisible: true, status: { in: ['HOT', 'BEST_SELLER'] } },
    include: { category: { select: { name: true } } },
    take: 4
  });

  // 3. Nếu hỏi so sánh
  if (cleanQuery.includes('so sánh') || cleanQuery.includes('vs') || cleanQuery.includes('sanh')) {
    if (productsToDisplay.length >= 2) {
      const p1 = productsToDisplay[0];
      const p2 = productsToDisplay[1];
      const p1Price = new Intl.NumberFormat('vi-VN').format(p1.salePrice);
      const p2Price = new Intl.NumberFormat('vi-VN').format(p2.salePrice);
      return `📊 **So sánh sản phẩm tại TechStore:**\n\n1️⃣ **${p1.name}**\n- **Hãng:** ${p1.brand} (${p1.category?.name})\n- **Giá bán:** ${p1Price}đ\n- **Tình trạng:** ${p1.stock > 0 ? `Còn hàng (${p1.stock})` : 'Hết hàng'}\n- **Đường dẫn:** /san-pham/${p1.slug}\n\n2️⃣ **${p2.name}**\n- **Hãng:** ${p2.brand} (${p2.category?.name})\n- **Giá bán:** ${p2Price}đ\n- **Tình trạng:** ${p2.stock > 0 ? `Còn hàng (${p2.stock})` : 'Hết hàng'}\n- **Đường dẫn:** /san-pham/${p2.slug}\n\n👉 *Tư vấn:* Cả hai sản phẩm đều đang sẵn hàng tại TechStore với bảo hành chính hãng!`;
    }
  }

  // 4. Trả lời tư vấn sản phẩm
  if (productsToDisplay.length > 0) {
    const itemsText = productsToDisplay.map(p => {
      const priceFormatted = new Intl.NumberFormat('vi-VN').format(p.salePrice);
      const stockText = p.stock > 0 ? `Còn ${p.stock} sp` : 'Hết hàng';
      return `• **${p.name}**\n  - Giá bán: **${priceFormatted}đ** (${stockText})\n  - Thương hiệu: ${p.brand} (${p.category?.name})\n  - Xem chi tiết: /san-pham/${p.slug}`;
    }).join('\n\n');

    return `🤖 **TechBot gợi ý các sản phẩm phù hợp nhất từ kho hàng TechStore:**\n\n${itemsText}\n\n👉 Bạn có thể gõ tên sản phẩm để xem thêm chi tiết hoặc chuyển sang tab "Chat với Admin" để được tư vấn thêm!`;
  }

  return `🤖 Chào bạn! Cửa hàng TechStore hiện có đầy đủ Điện thoại, Laptop, Tai nghe, Đồng hồ chính hãng.\nBạn có thể tham khảo sản phẩm trên trang chủ hoặc chuyển sang tab "Chat với Admin" để hỗ trợ nhé!`;
}

export class AiController {
  /**
   * RAG Chat với Claude AI (Kèm Smart Fallback từ DB)
   * POST /api/ai/chat
   */
  public static async chat(req: Request, res: Response) {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp nội dung tin nhắn.' });
    }

    const trimmedMsg = message.trim();

    // Nếu không có API KEY hoặc Key chưa cài đặt, dùng Smart Fallback từ CSDL ngay lập tức
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'dummy_key' || process.env.ANTHROPIC_API_KEY.length < 10) {
      console.log('ANTHROPIC_API_KEY not configured. Using Smart DB Fallback Engine.');
      const fallbackReply = await generateSmartFallbackAnswer(trimmedMsg);
      return res.status(200).json({ reply: fallbackReply });
    }

    try {
      // Step 1: Retrieve relevant products (RAG)
      const productContext = await getRelevantProducts(trimmedMsg);

      // Step 2: Build conversation history for Claude
      const systemPromptWithContext = `${SYSTEM_PROMPT}

## SẢN PHẨM HIỆN CÓ TRONG KHO (cập nhật thực tế):
${productContext || 'Không tìm thấy sản phẩm phù hợp trong database hiện tại.'}

---
Hãy tư vấn dựa trên thông tin sản phẩm trên. Nếu khách hỏi về sản phẩm không có trong danh sách, hãy thành thật và đề nghị khách liên hệ trực tiếp.`;

      const messages: Anthropic.MessageParam[] = [];
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

      messages.push({
        role: 'user',
        content: trimmedMsg
      });

      // Step 3: Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
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
      console.error('Claude AI chat error, switching to Smart Fallback:', error?.message || error);
      
      // Fallback về Smart DB Answer khi API Key hết tiền / 401 / lỗi kết nối
      const fallbackReply = await generateSmartFallbackAnswer(trimmedMsg);
      return res.status(200).json({ reply: fallbackReply });
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

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
- Đổi trả trong 7 ngày nếu có lỗi kỹ thuật từ nhà sản xuất
- Giao hàng toàn quốc, miễn phí đơn từ 500.000đ
- Giao hàng hỏa tốc trong 2h tại nội thành TP.HCM
- Thanh toán: COD (kiểm tra hàng trước khi thanh toán), Momo, Paypal
- Tích điểm thành viên: 100.000đ chi tiêu = 1 điểm
- Hạng thành viên: Bạc (0-499 điểm), Vàng (500-999 điểm, giảm thêm 2%), Bạch Kim (1000+ điểm, giảm thêm 5%)
- Hotline hỗ trợ: 1800-1234 (miễn phí, 8h-22h hàng ngày)
- Tra cứu đơn hàng: vào mục "Tra cứu đơn hàng" trên website hoặc trang Tài khoản
- Tra cứu bảo hành: vào mục "Bảo hành" trên website bằng SĐT hoặc mã bảo hành

## ĐỊNH DẠNG TRẢ LỜI — QUAN TRỌNG:
Luôn trả lời theo định dạng JSON thuần sau đây. Chỉ trả JSON, không bọc trong markdown code fence (không dùng \`\`\`json), không thêm bất kỳ text nào trước hoặc sau JSON:
{"reply": "nội dung trả lời đầy đủ ở đây", "suggestions": ["câu hỏi gợi ý 1 liên quan đến context", "câu hỏi gợi ý 2", "câu hỏi gợi ý 3"]}

Suggestions phải liên quan đến context vừa trả lời (ví dụ: nếu vừa tư vấn iPhone thì gợi ý so sánh, phụ kiện, bảo hành iPhone — không gợi ý về laptop).`;

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

interface FallbackResult {
  reply: string;
  suggestions: string[];
}

/**
 * Trả lời thông minh từ CSDL khi không có Claude API Key hoặc API bận
 */
async function generateSmartFallbackAnswer(query: string): Promise<FallbackResult> {
  const cleanQuery = query.toLowerCase().trim();

  // 1. Bảo hành
  if (cleanQuery.includes('bảo hành') || cleanQuery.includes('bao hanh')) {
    return {
      reply: `🛡️ **Chính sách bảo hành tại TechStore:**\n- Sản phẩm chính hãng bảo hành từ 12 - 24 tháng.\n- Đổi mới 1-1 trong 30 ngày nếu có lỗi từ nhà sản xuất.\n- Bạn có thể tra cứu bảo hành ngay tại trang chủ bằng SĐT hoặc Mã bảo hành (BH-XXXX).`,
      suggestions: ['Cách tra cứu mã bảo hành?', 'Lỗi kỹ thuật thì đổi trả như thế nào?', 'Bảo hành có áp dụng cho phụ kiện không?']
    };
  }

  // 2. Giao hàng / vận chuyển
  if (cleanQuery.includes('giao hàng') || cleanQuery.includes('vận chuyển') || cleanQuery.includes('ship')) {
    return {
      reply: `✈️ **Chính sách giao hàng TechStore:**\n- Giao hàng hỏa tốc trong 2h tại nội thành TP.HCM.\n- Miễn phí giao hàng toàn quốc cho đơn từ 500.000đ.\n- Hỗ trợ kiểm tra hàng trước khi thanh toán (COD).`,
      suggestions: ['Phí vận chuyển ngoại tỉnh bao nhiêu?', 'Đặt hàng COD có kiểm tra hàng được không?', 'Thời gian giao hàng ra Hà Nội mất bao lâu?']
    };
  }

  // 3. Thanh toán
  if (cleanQuery.includes('thanh toán') || cleanQuery.includes('momo') || cleanQuery.includes('paypal') || cleanQuery.includes('cod')) {
    return {
      reply: `💳 **Phương thức thanh toán hỗ trợ:**\n- Thanh toán khi nhận hàng (COD) — kiểm tra hàng trước.\n- Thanh toán qua ví MoMo QR.\n- Thanh toán thẻ quốc tế qua PayPal.\n- Chiết khấu thêm cho hội viên: Vàng (-2%), Bạch Kim (-5%).`,
      suggestions: ['Hạng thành viên Vàng có điều kiện gì?', 'Thanh toán MoMo có an toàn không?', 'Tôi có thể trả góp không?']
    };
  }

  // 4. Đổi trả
  if (cleanQuery.includes('đổi trả') || cleanQuery.includes('hoàn tiền') || cleanQuery.includes('trả hàng') || cleanQuery.includes('đổi hàng')) {
    return {
      reply: `🔄 **Chính sách đổi trả TechStore:**\n- Đổi trả trong **7 ngày** kể từ ngày nhận hàng nếu có lỗi kỹ thuật từ nhà sản xuất.\n- Sản phẩm phải còn nguyên hộp, đầy đủ phụ kiện.\n- Không áp dụng đổi trả nếu sản phẩm bị rơi vỡ, ngập nước, hoặc tự ý sửa chữa.\n- Liên hệ hotline **1800-1234** hoặc chat với Admin để được hỗ trợ.`,
      suggestions: ['Sản phẩm lỗi thì liên hệ ai?', 'Hotline TechStore là bao nhiêu?', 'Đổi trả mất bao lâu?']
    };
  }

  // 5. Tích điểm / hạng thành viên
  if (cleanQuery.includes('tích điểm') || cleanQuery.includes('thành viên') || cleanQuery.includes('hạng') || cleanQuery.includes('loyalty') || cleanQuery.includes('điểm')) {
    return {
      reply: `⭐ **Chương trình tích điểm TechStore:**\n- Cứ **100.000đ** chi tiêu = **1 điểm** tích lũy.\n- **Hạng Bạc** (0-499 điểm): Hưởng ưu đãi cơ bản.\n- **Hạng Vàng** (500-999 điểm): Giảm thêm **2%** trên mỗi đơn hàng.\n- **Hạng Bạch Kim** (1000+ điểm): Giảm thêm **5%** và ưu đãi độc quyền.`,
      suggestions: ['Voucher độc quyền cho Bạch Kim là gì?', 'Làm sao xem số điểm tích lũy?', 'Mua bao nhiêu thì lên hạng Vàng?']
    };
  }

  // 6. Khuyến mãi / giảm giá
  if (cleanQuery.includes('khuyến mãi') || cleanQuery.includes('giảm giá') || cleanQuery.includes('sale') || cleanQuery.includes('voucher') || cleanQuery.includes('mã giảm')) {
    return {
      reply: `🎁 **Khuyến mãi tại TechStore:**\n- Thành viên Vàng & Bạch Kim được giảm thêm 2-5% trên mỗi đơn.\n- Voucher mã giảm giá theo từng đợt — nhập tại trang thanh toán.\n- Sản phẩm HOT & BEST SELLER thường có giá ưu đãi đặc biệt.\n- Theo dõi trang chủ để cập nhật khuyến mãi mới nhất!`,
      suggestions: ['Cách nhập mã voucher khi đặt hàng?', 'Voucher dành riêng cho thành viên Bạch Kim?', 'Sản phẩm nào đang giảm giá nhiều nhất?']
    };
  }

  // 7. Theo dõi đơn hàng
  if (cleanQuery.includes('theo dõi') || cleanQuery.includes('tra cứu') || cleanQuery.includes('đơn hàng') || cleanQuery.includes('kiểm tra đơn')) {
    return {
      reply: `📦 **Tra cứu & theo dõi đơn hàng:**\n- Đã có tài khoản: Đăng nhập → Tài khoản → Lịch sử mua hàng.\n- Khách vãng lai: Vào trang **Tra cứu đơn hàng** trên website, nhập mã đơn hoặc SĐT.\n- Trạng thái đơn: Chờ xác nhận → Đã duyệt → Đang giao → Đã giao.\n- Có thắc mắc: Chat với Admin để được hỗ trợ trực tiếp.`,
      suggestions: ['Đơn hàng mất bao lâu để được duyệt?', 'Tôi có thể hủy đơn không?', 'Đặt hàng xong chưa thấy email xác nhận?']
    };
  }

  // 8. Liên hệ / hotline
  if (cleanQuery.includes('hotline') || cleanQuery.includes('liên hệ') || cleanQuery.includes('hỗ trợ') || cleanQuery.includes('tư vấn viên') || cleanQuery.includes('điện thoại')) {
    return {
      reply: `📞 **Liên hệ TechStore:**\n- **Hotline:** 1800-1234 (miễn phí, 8h-22h hàng ngày)\n- **Chat trực tiếp:** Chuyển sang tab "Chat với Admin" trong cửa sổ này\n- **Email:** support@techstore.vn\n- Nhân viên tư vấn sẽ phản hồi trong vòng vài phút!`,
      suggestions: ['Chat với Admin bây giờ', 'Giờ làm việc của TechStore?', 'Cách hủy đơn hàng?']
    };
  }

  // 9. Tìm kiếm sản phẩm phù hợp từ DB
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

  // So sánh sản phẩm
  if (cleanQuery.includes('so sánh') || cleanQuery.includes('vs') || cleanQuery.includes('sanh')) {
    if (productsToDisplay.length >= 2) {
      const p1 = productsToDisplay[0];
      const p2 = productsToDisplay[1];
      const p1Price = new Intl.NumberFormat('vi-VN').format(p1.salePrice);
      const p2Price = new Intl.NumberFormat('vi-VN').format(p2.salePrice);
      return {
        reply: `📊 **So sánh sản phẩm tại TechStore:**\n\n1️⃣ **${p1.name}**\n- **Hãng:** ${p1.brand} (${p1.category?.name})\n- **Giá bán:** ${p1Price}đ\n- **Tình trạng:** ${p1.stock > 0 ? `Còn hàng (${p1.stock})` : 'Hết hàng'}\n- **Đường dẫn:** /san-pham/${p1.slug}\n\n2️⃣ **${p2.name}**\n- **Hãng:** ${p2.brand} (${p2.category?.name})\n- **Giá bán:** ${p2Price}đ\n- **Tình trạng:** ${p2.stock > 0 ? `Còn hàng (${p2.stock})` : 'Hết hàng'}\n- **Đường dẫn:** /san-pham/${p2.slug}\n\n👉 *Tư vấn:* Cả hai sản phẩm đều đang sẵn hàng tại TechStore với bảo hành chính hãng!`,
        suggestions: [`Bảo hành ${p1.name} bao lâu?`, `${p2.name} có phụ kiện gì đi kèm?`, 'Chính sách đổi trả như thế nào?']
      };
    }
  }

  // Tư vấn sản phẩm
  if (productsToDisplay.length > 0) {
    const itemsText = productsToDisplay.map(p => {
      const priceFormatted = new Intl.NumberFormat('vi-VN').format(p.salePrice);
      const stockText = p.stock > 0 ? `Còn ${p.stock} sp` : 'Hết hàng';
      return `• **${p.name}**\n  - Giá bán: **${priceFormatted}đ** (${stockText})\n  - Thương hiệu: ${p.brand} (${p.category?.name})\n  - Xem chi tiết: /san-pham/${p.slug}`;
    }).join('\n\n');

    return {
      reply: `🤖 **TechBot gợi ý các sản phẩm phù hợp nhất từ kho hàng TechStore:**\n\n${itemsText}\n\n👉 Bạn có thể gõ tên sản phẩm để xem thêm chi tiết hoặc chuyển sang tab "Chat với Admin" để được tư vấn thêm!`,
      suggestions: ['Sản phẩm nào đang giảm giá?', 'Chính sách bảo hành như thế nào?', 'Giao hàng mất bao lâu?']
    };
  }

  return {
    reply: `🤖 Chào bạn! Cửa hàng TechStore hiện có đầy đủ Điện thoại, Laptop, Tai nghe, Đồng hồ chính hãng.\nBạn có thể tham khảo sản phẩm trên trang chủ hoặc chuyển sang tab "Chat với Admin" để hỗ trợ nhé!`,
    suggestions: ['Điện thoại tầm 10 triệu nên mua gì?', 'Laptop gaming dưới 20 triệu?', 'Chính sách bảo hành như thế nào?']
  };
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
      const fallback = await generateSmartFallbackAnswer(trimmedMsg);
      return res.status(200).json({ reply: fallback.reply, suggestions: fallback.suggestions });
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

      // Step 3: Call Claude API — model claude-haiku-4-5-20251001 (Claude Haiku 4.5, hiện hành)
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPromptWithContext,
        messages
      });

      const rawReply = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '{"reply": "Xin lỗi, tôi không thể xử lý yêu cầu này.", "suggestions": []}';

      // Step 4: Parse JSON — strip code fence trước nếu model tự thêm vào
      let reply = rawReply;
      let suggestions: string[] = [];

      try {
        const stripped = rawReply
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
        const parsed = JSON.parse(stripped);
        reply = parsed.reply || rawReply;
        suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
      } catch {
        // Model không trả JSON — dùng nguyên văn, suggestions rỗng
        reply = rawReply;
        suggestions = [];
      }

      return res.status(200).json({
        reply,
        suggestions,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        }
      });

    } catch (error: any) {
      console.error('Claude AI chat error, switching to Smart Fallback:', error?.message || error);
      
      // Fallback về Smart DB Answer khi API Key hết tiền / 401 / lỗi kết nối
      const fallback = await generateSmartFallbackAnswer(trimmedMsg);
      return res.status(200).json({ reply: fallback.reply, suggestions: fallback.suggestions });
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

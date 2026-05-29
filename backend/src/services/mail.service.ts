import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.EMAIL_PORT || process.env.SMTP_PORT || '587';
const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
const smtpFrom = process.env.EMAIL_USER || process.env.SMTP_USER || 'support@techstore.vn';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(smtpPort),
  secure: smtpPort === '465', // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export class MailService {
  /**
   * Send Password Reset Link
   */
  public static async sendResetPasswordEmail(email: string, token: string, clientUrl: string): Promise<void> {
    const resetLink = `${clientUrl}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"TechStore Support" <${smtpFrom}>`,
      to: email,
      subject: '[TechStore] Yêu cầu khôi phục mật khẩu tài khoản của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #0d6efd; text-align: center;">Khôi phục mật khẩu TechStore</h2>
          <p>Xin chào,</p>
          <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này. Vui lòng click vào nút bên dưới để tiến hành đặt lại mật khẩu mới (Liên kết này có hiệu lực trong vòng 15 phút):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0d6efd; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
          </div>
          <p>Nếu nút trên không hoạt động, bạn có thể copy link sau và dán vào thanh địa chỉ trình duyệt:</p>
          <p style="word-break: break-all; color: #555;">${resetLink}</p>
          <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; text-align: center;">Hệ thống hỗ trợ khách hàng TechStore</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  /**
   * Send Order Confirmation Email
   */
  public static async sendOrderConfirmationEmail(
    email: string, 
    order: {
      id: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      totalAmount: number;
      discountAmount: number;
      paymentMethod: string;
      items: Array<{
        productName: string;
        quantity: number;
        price: number;
      }>;
    }
  ): Promise<void> {
    const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount);
    const formattedDiscount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discountAmount);
    const payMethodName = order.paymentMethod === 'COD' ? 'Thanh toán COD (khi nhận hàng)' : order.paymentMethod === 'MOMO' ? 'Ví điện tử MoMo' : 'Cổng thanh toán PayPal';

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"TechStore Store" <${smtpFrom}>`,
      to: email,
      subject: `[TechStore] Xác nhận đơn hàng thành công #${order.id.substring(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #198754; text-align: center;">ĐẶT HÀNG THÀNH CÔNG!</h2>
          <p>Xin chào <strong>${order.customerName}</strong>,</p>
          <p>Cảm ơn bạn đã tin tưởng mua sắm tại <strong>TechStore</strong>. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.</p>
          
          <h3 style="border-bottom: 2px solid #198754; padding-bottom: 5px; color: #333;">Thông tin đơn hàng</h3>
          <p><strong>Mã đơn hàng:</strong> #${order.id.toUpperCase()}</p>
          <p><strong>Số điện thoại nhận hàng:</strong> ${order.customerPhone}</p>
          <p><strong>Địa chỉ giao hàng:</strong> ${order.customerAddress}</p>
          <p><strong>Phương thức thanh toán:</strong> ${payMethodName}</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd; width: 60px;">SL</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; width: 100px;">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Giảm giá:</td>
                <td style="padding: 10px; text-align: right; color: #dc3545;">-${formattedDiscount}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Tổng thanh toán:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px; color: #198754;">${formattedTotal}</td>
              </tr>
            </tfoot>
          </table>

          <p style="margin-top: 30px; font-style: italic; color: #555;">Đơn hàng sẽ được nhân viên giao hàng liên hệ xác nhận trong thời gian sớm nhất.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777; text-align: center;">Mọi thắc mắc vui lòng liên hệ hotline 1900 360 360. Cảm ơn bạn!</p>
        </div>
      `,
    };

    // Use try-catch so that if email setup is invalid, it won't block the checkout process flow
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Order confirmation email sent to ${email}`);
    } catch (err) {
      console.error('Failed to send order email, email config might be missing/incorrect:', err);
    }
  }
}

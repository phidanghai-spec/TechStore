import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service';
import { MailService } from '../services/mail.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'techstore_jwt_secret_key_for_development';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '30d') as any;

export class AuthController {
  /**
   * Đăng ký tài khoản
   */
  public static async register(req: Request, res: Response) {
    const { email, password, fullName, phone, address, dob } = req.body;

    if (!email || !password || !fullName || !phone || !address || !dob) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tất cả các trường.' });
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      return res.status(400).json({ 
        message: 'Bạn phải từ 16 tuổi trở lên để đăng ký',
        error: 'Phải từ 16 tuổi trở lên'
      });
    }
    if (age > 100 || birthDate > today) {
      return res.status(400).json({ message: 'Năm sinh không hợp lệ.' });
    }

    try {
      // Check duplicate email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email này đã được sử dụng.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          fullName,
          phone,
          password: hashedPassword,
          address,
          dob: new Date(dob),
          role: 'CUSTOMER', // Default role
          loyaltyPoints: 0,
          rank: 'SILVER'
        }
      });

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Exclude password from response
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        message: 'Đăng ký tài khoản thành công.',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo tài khoản.' });
    }
  }

  /**
   * Đăng nhập bằng email + mật khẩu
   */
  public static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    try {
      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
      }

      // Check account locked status
      if (user.isLocked) {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        message: 'Đăng nhập thành công.',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập.' });
    }
  }

  /**
   * Đổi mật khẩu tài khoản
   */
  public static async changePassword(req: AuthenticatedRequest, res: Response) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' });
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
      }

      // Hash and update new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      return res.status(200).json({ message: 'Thay đổi mật khẩu thành công.' });

    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi đổi mật khẩu.' });
    }
  }

  /**
   * Quên mật khẩu - gửi link qua email
   */
  public static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const frontendUrl = req.headers.referer || 'http://localhost:3000';

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Return 200 to prevent user enumeration attacks, but with a neutral message
        return res.status(200).json({ message: 'Nếu email tồn tại trên hệ thống, một liên kết khôi phục đã được gửi.' });
      }

      // Generate a short-lived reset token (15 minutes)
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, type: 'reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Send email using MailService
      await MailService.sendResetPasswordEmail(user.email, resetToken, frontendUrl);

      return res.status(200).json({
        message: 'Liên kết khôi phục mật khẩu đã được gửi đến email của bạn.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi gửi yêu cầu quên mật khẩu.' });
    }
  }

  /**
   * Đặt lại mật khẩu mới bằng reset token
   */
  public static async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Thiếu token xác thực hoặc mật khẩu mới.' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; type: string };
      
      if (decoded.type !== 'reset') {
        return res.status(400).json({ message: 'Token khôi phục mật khẩu không hợp lệ.' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedPassword }
      });

      return res.status(200).json({ message: 'Đặt lại mật khẩu mới thành công. Bạn đã có thể đăng nhập.' });

    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
  }

  /**
   * Cập nhật thông tin profile cá nhân
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { fullName, phone, address, address2, bankAccount, dob } = req.body;

    if (!fullName || !phone || !address || !dob) {
      return res.status(400).json({ message: 'Họ tên, số điện thoại, địa chỉ 1, ngày sinh là các trường bắt buộc.' });
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      return res.status(400).json({ 
        message: 'Bạn phải từ 16 tuổi trở lên để cập nhật thông tin cá nhân',
        error: 'Phải từ 16 tuổi trở lên'
      });
    }
    if (age > 100 || birthDate > today) {
      return res.status(400).json({ message: 'Năm sinh không hợp lệ.' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName,
          phone,
          address,
          address2: address2 || null,
          bankAccount: bankAccount || null,
          dob: new Date(dob)
        }
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.status(200).json({
        message: 'Cập nhật thông tin tài khoản thành công.',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin cá nhân.' });
    }
  }
}

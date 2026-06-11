import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../services/prisma.service';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'techstore_jwt_secret_key_for_development';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '30d') as any;

export class FacebookAuthController {
  /**
   * Redirect user browser to Facebook OAuth Dialog
   */
  public static loginRedirect(req: Request, res: Response) {
    if (!FACEBOOK_APP_ID || !FACEBOOK_CALLBACK_URL) {
      console.error('Facebook App ID or Callback URL is missing in environment configuration.');
      return res.status(500).json({ 
        message: 'Chức năng đăng nhập Facebook chưa được cấu hình. Vui lòng thiết lập FACEBOOK_APP_ID và FACEBOOK_CALLBACK_URL.' 
      });
    }

    const redirectUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
      FACEBOOK_CALLBACK_URL
    )}&scope=email,public_profile`;

    return res.redirect(redirectUrl);
  }

  /**
   * Handle the OAuth redirect from Facebook, exchange code for user details, and log the user in
   */
  public static async callback(req: Request, res: Response) {
    const { code, error } = req.query;

    if (error) {
      console.error('Facebook OAuth redirect error:', error);
      return res.redirect(
        `${FRONTEND_URL}/account?error=${encodeURIComponent('Đăng nhập Facebook bị từ chối hoặc gặp lỗi.')}`
      );
    }

    if (!code) {
      return res.redirect(
        `${FRONTEND_URL}/account?error=${encodeURIComponent('Không nhận được authorization code từ Facebook.')}`
      );
    }

    try {
      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !FACEBOOK_CALLBACK_URL) {
        throw new Error('Facebook settings missing in environment variables.');
      }

      // 1. Exchange auth code for access token
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        FACEBOOK_CALLBACK_URL
      )}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`;

      const tokenRes = await fetch(tokenUrl);
      const tokenData: any = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Error exchanging code for access token:', tokenData);
        return res.redirect(
          `${FRONTEND_URL}/account?error=${encodeURIComponent('Không thể lấy access token từ Facebook.')}`
        );
      }

      const accessToken = tokenData.access_token;

      // 2. Fetch Facebook user profile details
      const profileUrl = `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`;
      const profileRes = await fetch(profileUrl);
      const profileData: any = await profileRes.json();

      if (!profileRes.ok || !profileData.id) {
        console.error('Error fetching Facebook user profile:', profileData);
        return res.redirect(
          `${FRONTEND_URL}/account?error=${encodeURIComponent('Không thể lấy thông tin profile của Facebook.')}`
        );
      }

      const facebookId = profileData.id;
      const fullName = profileData.name || 'Facebook User';
      // Fallback email if Facebook doesn't provide email (e.g. unverified account)
      const userEmail = profileData.email || `${facebookId}@facebook.com`;

      // 3. Find user or create if they do not exist
      let user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (user) {
        if (user.isLocked) {
          return res.redirect(
            `${FRONTEND_URL}/account?error=${encodeURIComponent('Tài khoản của bạn đã bị khóa.')}`
          );
        }
      } else {
        // Create user with default placeholders (age >= 16 required)
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await prisma.user.create({
          data: {
            email: userEmail,
            fullName,
            phone: '0000000000',
            address: 'Facebook Login',
            password: hashedPassword,
            dob: new Date('2000-01-01'), // age will be > 16
            role: 'CUSTOMER',
            loyaltyPoints: 0,
            rank: 'SILVER'
          }
        });
      }

      // 4. Generate JWT token for TechStore auth
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { password: _, ...userWithoutPassword } = user;

      // 5. Redirect browser back to frontend account page with token and user object
      const redirectTarget = `${FRONTEND_URL}/account?token=${token}&user=${encodeURIComponent(
        JSON.stringify(userWithoutPassword)
      )}`;

      return res.redirect(redirectTarget);

    } catch (err: any) {
      console.error('Facebook callback crash:', err);
      return res.redirect(
        `${FRONTEND_URL}/account?error=${encodeURIComponent('Lỗi hệ thống trong quá trình đăng nhập Facebook.')}`
      );
    }
  }
}

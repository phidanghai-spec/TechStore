import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'CUSTOMER';
  }
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techstore_jwt_secret_key_for_development') as {
      id: string;
      email: string;
      role: 'ADMIN' | 'CUSTOMER';
    };

    // Check if user is locked
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isLocked: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại trên hệ thống.' });
    }

    if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

export const verifyTokenOptional = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Cho phép đi tiếp, req.user sẽ là undefined
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techstore_jwt_secret_key_for_development') as {
      id: string;
      email: string;
      role: 'ADMIN' | 'CUSTOMER';
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isLocked: true }
    });

    if (user && !user.isLocked) {
      req.user = decoded;
    }
    next();
  } catch (error) {
    // Có lỗi token nhưng vì là optional nên cứ cho qua
    next();
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.' });
  }
  next();
};

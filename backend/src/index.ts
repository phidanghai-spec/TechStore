import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import { SocketService } from './services/socket.service';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

// Middlewares
app.use(compression());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || /https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (sharp optimized images)
app.use('/uploads', express.static('uploads'));

// Initialize Socket.io
SocketService.init(server, FRONTEND_URL);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Chào mừng bạn đến với API của TechStore!' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import and Register Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import couponRoutes from './routes/coupon.routes';
import reviewRoutes from './routes/review.routes';
import qnaRoutes from './routes/qna.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';
import warrantyRoutes from './routes/warranty.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/qnas', qnaRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống nghiêm trọng',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start Server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Self-ping để tránh Render sleep (free tier cold start)
if (process.env.NODE_ENV === 'production') {
  const RENDER_URL = process.env.RENDER_URL || 'https://techstore-backend-ftzs.onrender.com';
  setInterval(() => {
    fetch(`${RENDER_URL}/api/health`)
      .then(() => console.log('Self-ping OK:', new Date().toISOString()))
      .catch((err: Error) => console.log('Self-ping failed:', err.message));
  }, 14 * 60 * 1000); // Ping mỗi 14 phút
  console.log('Self-ping enabled for Render keep-alive');
}


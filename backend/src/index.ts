import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { SocketService } from './services/socket.service';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middlewares
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/qnas', qnaRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/warranties', warrantyRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống nghiêm trọng',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

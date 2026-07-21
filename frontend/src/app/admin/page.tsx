'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(() => import('../../components/RevenueChart'), {
  ssr: false,
  loading: () => <div className="text-center py-5 text-secondary">Đang tải biểu đồ doanh thu...</div>
});

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BACKEND_URL;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'coupons' | 'cskh' | 'chat' | 'warranties'>('dashboard');

  // Dashboard Stats State
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Products CRUD State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodOrigPrice, setProdOrigPrice] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodStatus, setProdStatus] = useState<'HOT' | 'BEST_SELLER' | 'NORMAL'>('NORMAL');
  const [prodImg, setProdImg] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodTags, setProdTags] = useState('');
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryStaffName, setDeliveryStaffName] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  // Dashboard Filter State
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  // Orders Filter State
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Product Visibility State
  const [prodVisible, setProdVisible] = useState(true);

  // Users State
  const [users, setUsers] = useState<any[]>([]);

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [cpCode, setCpCode] = useState('');
  const [cpType, setCpType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [cpValue, setCpValue] = useState('');
  const [cpMaxUsage, setCpMaxUsage] = useState('');
  const [cpExpiry, setCpExpiry] = useState('');

  // CSKH (Reviews & QnA) State
  const [reviews, setReviews] = useState<any[]>([]);
  const [qnas, setQnas] = useState<any[]>([]);
  const [qnaAnswerText, setQnaAnswerText] = useState('');
  const [answeringQnaId, setAnsweringQnaId] = useState<string | null>(null);

  // Admin Chat State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Verify Admin role on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/account');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'ADMIN') {
        alert('Bạn không có quyền truy cập trang quản trị.');
        router.push('/account');
      } else {
        setIsAdmin(true);
      }
    } catch (e) {
      router.push('/account');
    }
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'products') { fetchAdminProducts(); fetchCats(); }
    if (activeTab === 'orders') fetchAdminOrders();
    if (activeTab === 'users') fetchAdminUsers();
    if (activeTab === 'coupons') fetchAdminCoupons();
    if (activeTab === 'cskh') { fetchAdminReviews(); fetchAdminQnas(); }
    if (activeTab === 'chat') { fetchAdminChatList(); initChatSocket(); }
    if (activeTab === 'warranties') fetchAdminWarranties();

    // cleanup socket on tab change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAdmin, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isCustomerTyping]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  // ==========================================
  // API FETCH CALLS
  // ==========================================
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statsStartDate) params.append('startDate', statsStartDate);
      if (statsEndDate) params.append('endDate', statsEndDate);
      const res = await fetch(`${BACKEND_URL}/api/admin/stats?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    setStatsLoading(false);
  };

  const fetchAdminProducts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/products`, { headers: getHeaders() });
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchCats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/categories`);
      if (res.ok) setCategories(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAdminOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (orderStartDate) params.append('startDate', orderStartDate);
      if (orderEndDate) params.append('endDate', orderEndDate);
      if (orderStatusFilter) params.append('status', orderStatusFilter);
      const res = await fetch(`${BACKEND_URL}/api/admin/orders?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: getHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAdminCoupons = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/coupons`, { headers: getHeaders() });
      if (res.ok) setCoupons(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAdminReviews = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews`, { headers: getHeaders() });
      if (res.ok) setReviews(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAdminQnas = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/qnas`, { headers: getHeaders() });
      if (res.ok) setQnas(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchAdminChatList = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chats/admin/list`, { headers: getHeaders() });
      if (res.ok) setConversations(await res.json());
    } catch (e) { console.error(e); }
  };

  // ==========================================
  // PRODUCTS CRUD LOGIC
  // ==========================================
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProdId 
      ? `${BACKEND_URL}/api/admin/products/${editingProdId}`
      : `${BACKEND_URL}/api/admin/products`;
    
    const method = editingProdId ? 'PUT' : 'POST';

    const bodyData = {
      name: prodName,
      categoryId: prodCategory,
      brand: prodBrand,
      originalPrice: prodOrigPrice,
      salePrice: prodSalePrice,
      stock: prodStock,
      status: prodStatus,
      imageUrl: prodImg,
      description: prodDesc,
      tags: prodTags,
      isVisible: prodVisible
    };

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        clearProductForm();
        fetchAdminProducts();
      } else {
        alert(data.message || 'Lỗi xử lý sản phẩm.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const handleEditProduct = (p: any) => {
    setEditingProdId(p.id);
    setProdName(p.name);
    setProdCategory(p.categoryId);
    setProdBrand(p.brand);
    setProdOrigPrice(p.originalPrice.toString());
    setProdSalePrice(p.salePrice.toString());
    setProdStock(p.stock.toString());
    setProdStatus(p.status);
    setProdImg(p.imageUrl);
    setProdDesc(p.description);
    setProdTags(p.tags);
    setProdVisible(p.isVisible);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        alert('Xóa thành công!');
        fetchAdminProducts();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi xóa sản phẩm.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isVisible })
      });
      if (res.ok) {
        fetchAdminProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearProductForm = () => {
    setEditingProdId(null);
    setProdName('');
    setProdCategory('');
    setProdBrand('');
    setProdOrigPrice('');
    setProdSalePrice('');
    setProdStock('');
    setProdStatus('NORMAL');
    setProdImg('');
    setProdDesc('');
    setProdTags('');
    setProdVisible(true);
  };

  // ==========================================
  // ORDERS MANAGEMENT LOGIC
  // ==========================================
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ orderStatus: status })
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminOrders();
      } else {
        alert(data.message || 'Lỗi cập nhật trạng thái đơn hàng.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryStaffName.trim() || !assigningOrderId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${assigningOrderId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          orderStatus: 'SHIPPING',
          deliveryStaff: deliveryStaffName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAssigningOrderId(null);
        setDeliveryStaffName('');
        fetchAdminOrders();
      } else {
        alert(data.message || 'Lỗi phân công giao hàng.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const handleCollectDebt = async (orderId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/${orderId}/collect-debt`, {
        method: 'PUT',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        fetchAdminOrders();
      } else {
        alert(data.message || 'Lỗi thu tiền công nợ.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  // User CRUD states & handlers
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userPasswordResetOpen, setUserPasswordResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [usrEmail, setUsrEmail] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrFullName, setUsrFullName] = useState('');
  const [usrPhone, setUsrPhone] = useState('');
  const [usrAddress, setUsrAddress] = useState('');
  const [usrAddress2, setUsrAddress2] = useState('');
  const [usrBankAccount, setUsrBankAccount] = useState('');
  const [usrDob, setUsrDob] = useState('');
  const [usrRole, setUsrRole] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  const [usrLoyaltyPoints, setUsrLoyaltyPoints] = useState('');
  const [usrRank, setUsrRank] = useState<'SILVER' | 'GOLD' | 'PLATINUM'>('SILVER');
  const [usrDeposit, setUsrDeposit] = useState('');
  const [usrNewPassword, setUsrNewPassword] = useState('');

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedUser
      ? `${BACKEND_URL}/api/admin/users/${selectedUser.id}`
      : `${BACKEND_URL}/api/admin/users`;
    
    const method = selectedUser ? 'PUT' : 'POST';

    const bodyData = {
      email: usrEmail,
      password: usrPassword || undefined,
      fullName: usrFullName,
      phone: usrPhone,
      address: usrAddress,
      address2: usrAddress2 || null,
      bankAccount: usrBankAccount || null,
      dob: usrDob,
      role: usrRole,
      loyaltyPoints: Math.floor(parseInt(usrLoyaltyPoints || '0') / 100000),
      rank: usrRank,
      deposit: parseFloat(usrDeposit || '0')
    };

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(selectedUser ? 'Cập nhật thông tin thành công!' : 'Tạo người dùng mới thành công!');
        setUserModalOpen(false);
        clearUserForm();
        fetchAdminUsers();
      } else {
        alert(data.message || 'Lỗi xử lý.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const handleEditUserClick = (u: any) => {
    setSelectedUser(u);
    setUsrEmail(u.email);
    setUsrPassword('');
    setUsrFullName(u.fullName);
    setUsrPhone(u.phone);
    setUsrAddress(u.address);
    setUsrAddress2(u.address2 || '');
    setUsrBankAccount(u.bankAccount || '');
    setUsrDob(u.dob ? u.dob.substring(0, 10) : '');
    setUsrRole(u.role);
    setUsrLoyaltyPoints((u.loyaltyPoints * 100000).toString());
    setUsrRank(u.rank);
    setUsrDeposit(u.deposit ? u.deposit.toString() : '0');
    setUserModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrNewPassword || !selectedUser) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword: usrNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Đặt lại mật khẩu thành công!');
        setUserPasswordResetOpen(false);
        setUsrNewPassword('');
      } else {
        alert(data.message || 'Lỗi xử lý.');
      }
    } catch (err) {
      alert('Lỗi kết nối.');
    }
  };

  const clearUserForm = () => {
    setSelectedUser(null);
    setUsrEmail('');
    setUsrPassword('');
    setUsrFullName('');
    setUsrPhone('');
    setUsrAddress('');
    setUsrAddress2('');
    setUsrBankAccount('');
    setUsrDob('');
    setUsrRole('CUSTOMER');
    setUsrLoyaltyPoints('');
    setUsrRank('SILVER');
    setUsrDeposit('');
  };

  // Warranty Admin states & handlers
  const [warranties, setWarranties] = useState<any[]>([]);
  const [warrantyStatusFilter, setWarrantyStatusFilter] = useState('');
  const [warrantyQueryFilter, setWarrantyQueryFilter] = useState('');
  const [editingWarranty, setEditingWarranty] = useState<any>(null);
  const [wrtStatus, setWrtStatus] = useState<'ACTIVE' | 'EXPIRED' | 'CLAIMED'>('ACTIVE');
  const [wrtNotes, setWrtNotes] = useState('');

  const fetchAdminWarranties = async () => {
    try {
      const params = new URLSearchParams();
      if (warrantyStatusFilter) params.append('status', warrantyStatusFilter);
      if (warrantyQueryFilter) params.append('query', warrantyQueryFilter);

      const res = await fetch(`${BACKEND_URL}/api/admin/warranties?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        setWarranties(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateWarrantySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarranty) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/warranties/${editingWarranty.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: wrtStatus, notes: wrtNotes })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Cập nhật bảo hành thành công!');
        setEditingWarranty(null);
        fetchAdminWarranties();
      } else {
        alert(data.message || 'Lỗi cập nhật.');
      }
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // USERS MANAGEMENT LOGIC
  // ==========================================
  const handleToggleLockUser = async (userId: string, currentLock: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/lock`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isLocked: !currentLock })
      });
      if (res.ok) {
        fetchAdminUsers();
      }
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // COUPONS CRUD LOGIC
  // ==========================================
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          code: cpCode,
          discountType: cpType,
          discountValue: cpValue,
          maxUsage: cpMaxUsage,
          expiryDate: cpExpiry
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Tạo mã giảm giá thành công!');
        setCpCode('');
        setCpValue('');
        setCpMaxUsage('');
        setCpExpiry('');
        fetchAdminCoupons();
      } else {
        alert(data.message || 'Lỗi tạo mã giảm giá.');
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAdminCoupons();
      }
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // CSKH LOGIC (REVIEWS & QNAS)
  // ==========================================
  const handleToggleReview = async (reviewId: string, currentApproval: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reviews/${reviewId}/toggle`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isApproved: !currentApproval })
      });
      if (res.ok) {
        fetchAdminReviews();
      }
    } catch (err) { console.error(err); }
  };

  const handleAnswerQnaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qnaAnswerText.trim() || !answeringQnaId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/qnas/${answeringQnaId}/answer`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ answer: qnaAnswerText })
      });
      if (res.ok) {
        setAnsweringQnaId(null);
        setQnaAnswerText('');
        fetchAdminQnas();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteQna = async (id: string) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/qnas/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) fetchAdminQnas();
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // REAL-TIME CHAT LOGIC FOR ADMIN
  // ==========================================
  const initChatSocket = () => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    // Listen for new messages globally
    socket.on('new_message_notification', (data: any) => {
      // Refresh chat list to show new message preview
      fetchAdminChatList();
      
      // If we are currently chatting with this customer, add to message list
      if (activeCustomerId && data.roomId === activeCustomerId) {
        setChatMessages(prev => [...prev, data.message]);
      }
    });

    // Listen for typing indicator
    socket.on('typing_status', (data: { isTyping: boolean; senderName: string }) => {
      // If active conversation customer is typing
      if (activeCustomerId) {
        setIsCustomerTyping(data.isTyping);
      }
    });
  };

  const handleSelectCustomerChat = async (customerId: string) => {
    setActiveCustomerId(customerId);
    setChatMessages([]);
    setIsCustomerTyping(false);

    if (socketRef.current) {
      socketRef.current.emit('join_room', customerId); // Join customer room
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/chats/admin/history/${customerId}`, { headers: getHeaders() });
      if (res.ok) {
        setChatMessages(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleAdminSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !activeCustomerId || !socketRef.current) return;

    const storedUser = JSON.parse(localStorage.getItem('user')!);

    socketRef.current.emit('send_message', {
      senderId: storedUser.id,
      receiverId: activeCustomerId,
      message: adminChatInput.trim(),
      roomId: activeCustomerId
    });

    // Emit stop typing
    socketRef.current.emit('typing', {
      roomId: activeCustomerId,
      isTyping: false,
      senderName: 'Admin'
    });

    setAdminChatInput('');
  };

  const handleAdminChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminChatInput(e.target.value);
    if (!socketRef.current || !activeCustomerId) return;

    socketRef.current.emit('typing', {
      roomId: activeCustomerId,
      isTyping: e.target.value.length > 0,
      senderName: 'Admin'
    });
  };

  if (!isAdmin) {
    return (
      <div className="bg-black text-white min-vh-100 d-flex justify-content-center align-items-center">
        <p className="fs-5">Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="bg-black text-white py-5 min-vh-100">
        <div className="container-fluid px-md-5">
          <h2 className="text-uppercase mb-5 pb-2 border-bottom border-secondary">Trang quản trị TechStore</h2>
          
          <div className="row g-4">
            {/* Admin Sidebar Navigation */}
            <div className="col-lg-3">
              <div className="bg-dark p-4 rounded border border-secondary">
                <div className="list-group list-group-flush bg-transparent">
                  <button onClick={() => setActiveTab('dashboard')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'dashboard' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    📊 Thống kê doanh thu
                  </button>
                  <button onClick={() => setActiveTab('products')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'products' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    📱 Quản lý sản phẩm (CRUD)
                  </button>
                  <button onClick={() => setActiveTab('orders')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'orders' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    📦 Xử lý đơn hàng {orders.filter(o=>o.orderStatus==='PENDING').length > 0 && <span className="badge bg-warning text-black ms-2">{orders.filter(o=>o.orderStatus==='PENDING').length}</span>}
                  </button>
                  <button onClick={() => setActiveTab('users')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'users' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    👥 Quản lý người dùng
                  </button>
                  <button onClick={() => setActiveTab('coupons')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'coupons' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    🎟 Mã khuyến mãi (Vouchers)
                  </button>
                  <button onClick={() => setActiveTab('cskh')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'cskh' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    💬 Duyệt Đánh giá & Hỏi đáp
                  </button>
                  <button onClick={() => setActiveTab('warranties')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'warranties' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    🛡 Quản lý Bảo hành
                  </button>
                  <button onClick={() => setActiveTab('chat')} className={`list-group-item list-group-item-action bg-transparent border-0 text-start py-2 fs-7 ${activeTab === 'chat' ? 'text-primary fw-bold' : 'text-secondary'}`}>
                    💬 Chat hỗ trợ trực tuyến
                  </button>
                </div>
              </div>
            </div>

            {/* Main Admin Panels */}
            <div className="col-lg-9">
              <div className="bg-dark p-4 rounded border border-secondary h-100">
                
                {/* ==========================================
                    1. DASHBOARD PANEL
                   ========================================== */}
                {activeTab === 'dashboard' && (
                  <div>
                    <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Báo cáo doanh thu & Hoạt động</h4>
                    
                    {/* Stats Filter Bar */}
                    <div className="d-flex gap-2 mb-4 flex-wrap align-items-end bg-black p-3 rounded border border-secondary">
                      <div>
                        <label className="form-label fs-8 text-secondary">Từ ngày</label>
                        <input type="date" className="form-control form-control-sm bg-dark border-secondary text-white fs-7" value={statsStartDate} onChange={(e) => setStatsStartDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label fs-8 text-secondary">Đến ngày</label>
                        <input type="date" className="form-control form-control-sm bg-dark border-secondary text-white fs-7" value={statsEndDate} onChange={(e) => setStatsEndDate(e.target.value)} />
                      </div>
                      <button onClick={fetchStats} className="btn btn-primary btn-sm px-3">Lọc thống kê</button>
                      {(statsStartDate || statsEndDate) && (
                        <button onClick={() => { 
                          setStatsStartDate(''); 
                          setStatsEndDate(''); 
                          // Fetch directly with empty params to avoid stale state in same tick
                          const resCall = async () => {
                            setStatsLoading(true);
                            try {
                              const res = await fetch(`${BACKEND_URL}/api/admin/stats`, { headers: getHeaders() });
                              if (res.ok) setStats(await res.json());
                            } catch (e) { console.error(e); }
                            setStatsLoading(false);
                          };
                          resCall();
                        }} className="btn btn-outline-secondary btn-sm">Bỏ lọc</button>
                      )}
                    </div>

                    {statsLoading ? (
                      <p className="text-center text-secondary py-5">Đang xử lý dữ liệu thống kê...</p>
                    ) : stats ? (
                      <>
                        <div className="row g-4 mb-5 text-center">
                          <div className="col-md-4">
                            <div className="bg-black p-3 rounded border border-secondary">
                              <span className="text-secondary fs-8 uppercase d-block mb-1">Tổng doanh thu</span>
                              <h3 className="text-primary fw-bold m-0">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)}</h3>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="bg-black p-3 rounded border border-secondary">
                              <span className="text-secondary fs-8 uppercase d-block mb-1">COD vs Thanh toán Online</span>
                              <h4 className="text-success m-0" style={{ fontSize: '1.1rem' }}>
                                COD: {new Intl.NumberFormat('vi-VN').format(stats.paymentSplit.cod)}đ <br />
                                Online: {new Intl.NumberFormat('vi-VN').format(stats.paymentSplit.online)}đ
                              </h4>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="bg-black p-3 rounded border border-secondary">
                              <span className="text-secondary fs-8 uppercase d-block mb-1">Trạng thái đơn hàng</span>
                              <div className="d-flex justify-content-center gap-2 flex-wrap fs-8 text-secondary mt-1">
                                <span>Chờ duyệt: {stats.statusCounts.PENDING || 0}</span> |
                                <span>Đang giao: {stats.statusCounts.SHIPPING || 0}</span> |
                                <span>Đã giao: {stats.statusCounts.DELIVERED || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Chart */}
                        <h5 className="text-white fs-7 mb-3">Biểu đồ doanh thu theo thời gian</h5>
                        <RevenueChart data={stats.chartData} />
                      </>
                    ) : <p>Lỗi tải dữ liệu.</p>}
                  </div>
                )}

                {/* ==========================================
                    2. PRODUCTS Panel (CRUD)
                   ========================================== */}
                {activeTab === 'products' && (
                  <div>
                    <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">{editingProdId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h4>
                    
                    {/* Add/Edit Form */}
                    <form onSubmit={handleProductSubmit} className="mb-5 bg-black p-3 rounded border border-secondary">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label fs-8 text-secondary">Tên sản phẩm</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="iPhone 16 Pro Max..." />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Danh mục</label>
                          <select className="form-select bg-dark border-secondary text-white fs-7" required value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                            <option value="">Chọn danh mục</option>
                            {categories.map((c, i) => (
                              <option key={i} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Hãng sản xuất</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={prodBrand} onChange={(e) => setProdBrand(e.target.value)} placeholder="Apple, Samsung..." />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Giá gốc (VND)</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white fs-7" required value={prodOrigPrice} onChange={(e) => setProdOrigPrice(e.target.value)} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Giá khuyến mãi (VND)</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white fs-7" required value={prodSalePrice} onChange={(e) => setProdSalePrice(e.target.value)} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Số lượng tồn kho</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white fs-7" required value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Phân loại hàng</label>
                          <select className="form-select bg-dark border-secondary text-white fs-7" value={prodStatus} onChange={(e: any) => setProdStatus(e.target.value)}>
                            <option value="NORMAL">Bình thường (NORMAL)</option>
                            <option value="HOT">Hàng HOT</option>
                            <option value="BEST_SELLER">Bán chạy (BEST_SELLER)</option>
                          </select>
                        </div>
                        <div className="col-md-3 mb-3 d-flex align-items-end" style={{ minHeight: '68px' }}>
                          <div className="form-check form-switch mb-2">
                            <input className="form-check-input" type="checkbox" id="prodVisibleCheckbox" checked={prodVisible} onChange={(e) => setProdVisible(e.target.checked)} />
                            <label className="form-check-label fs-8 text-secondary" htmlFor="prodVisibleCheckbox">Hiển thị trên web</label>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fs-8 text-secondary">URL hình ảnh</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={prodImg} onChange={(e) => setProdImg(e.target.value)} placeholder="https://images.unsplash.com/..." />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label fs-8 text-secondary">Tìm kiếm Tags (cách nhau bởi dấu phẩy)</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white fs-7" value={prodTags} onChange={(e) => setProdTags(e.target.value)} placeholder="iphone, flagship, 256gb" />
                        </div>
                        <div className="col-md-12 mb-3">
                          <label className="form-label fs-8 text-secondary">Thông số kỹ thuật chi tiết (Cấu hình chuỗi JSON)</label>
                          <textarea className="form-control bg-dark border-secondary text-white fs-7 font-monospace" rows={3} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder='{"screen":"6.9 inch","cpu":"A18 Pro","ram":"8 GB","storage":"256 GB","detail":"Chi tiết..."}'></textarea>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary btn-sm px-4">{editingProdId ? 'Cập nhật' : 'Thêm mới'}</button>
                        {editingProdId && <button type="button" onClick={clearProductForm} className="btn btn-outline-secondary btn-sm">Hủy</button>}
                      </div>
                    </form>

                    {/* Products List Table */}
                    <h5 className="text-white text-uppercase fs-6 mb-3">Danh sách sản phẩm hiện tại</h5>
                    <div className="table-responsive rounded border border-secondary bg-black" style={{ maxHeight: '400px' }}>
                      <table className="table table-dark table-striped align-middle fs-7 m-0">
                        <thead>
                          <tr>
                            <th className="ps-3">Sản phẩm</th>
                            <th>Hãng</th>
                            <th>Giá bán</th>
                            <th>Kho</th>
                            <th>Trạng thái</th>
                            <th>Hiển thị</th>
                            <th className="text-center" style={{ width: '150px' }}>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p, i) => (
                            <tr key={i}>
                              <td className="ps-3">
                                <div className="d-flex align-items-center gap-2">
                                  <img 
                                    src={p.imageUrl || 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore'} 
                                    width="35" 
                                    height="35" 
                                    className="rounded" 
                                    style={{ objectFit: 'contain' }} 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/1a1a1a/ffffff?text=TechStore';
                                    }}
                                  />
                                  <span className="text-white text-truncate" style={{ maxWidth: '150px' }}>{p.name}</span>
                                </div>
                              </td>
                              <td>{p.brand}</td>
                              <td>{new Intl.NumberFormat('vi-VN').format(p.salePrice)}đ</td>
                              <td>
                                {p.stock === 0 ? (
                                  p.status === 'HOT' ? <span className="text-warning fw-bold">CHÁY HÀNG</span> : <span className="text-danger">Hết</span>
                                ) : p.stock}
                              </td>
                              <td><span className={`badge ${p.status==='HOT'?'bg-warning text-black':p.status==='BEST_SELLER'?'bg-success':'bg-secondary'}`}>{p.status}</span></td>
                              <td>
                                <div className="form-check form-switch">
                                  <input className="form-check-input" type="checkbox" checked={p.isVisible} onChange={() => handleToggleVisibility(p.id, !p.isVisible)} />
                                </div>
                              </td>
                              <td className="text-center">
                                <button onClick={() => handleEditProduct(p)} className="btn btn-link text-primary btn-sm p-0 me-2">Sửa</button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="btn btn-link text-danger btn-sm p-0">Xóa</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* ==========================================
                    3. ORDERS PANEL (Xử lý đơn hàng)
                   ========================================== */}
                {activeTab === 'orders' && (
                  <div>
                    <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Xử lý đơn hàng</h4>

                    {/* Order Filter Bar */}
                    <div className="d-flex gap-2 mb-4 flex-wrap align-items-end bg-black p-3 rounded border border-secondary">
                      <div>
                        <label className="form-label fs-8 text-secondary">Từ ngày</label>
                        <input type="date" className="form-control form-control-sm bg-dark border-secondary text-white fs-7" value={orderStartDate} onChange={(e) => setOrderStartDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label fs-8 text-secondary">Đến ngày</label>
                        <input type="date" className="form-control form-control-sm bg-dark border-secondary text-white fs-7" value={orderEndDate} onChange={(e) => setOrderEndDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label fs-8 text-secondary">Trạng thái</label>
                        <select className="form-select form-select-sm bg-dark border-secondary text-white fs-7" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                          <option value="">Tất cả trạng thái</option>
                          <option value="PENDING">Chờ duyệt (PENDING)</option>
                          <option value="APPROVED">Đã duyệt (APPROVED)</option>
                          <option value="SHIPPING">Đang giao (SHIPPING)</option>
                          <option value="DELIVERED">Đã giao (DELIVERED)</option>
                          <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                        </select>
                      </div>
                      <button onClick={fetchAdminOrders} className="btn btn-primary btn-sm px-3">Lọc</button>
                      {(orderStartDate || orderEndDate || orderStatusFilter) && (
                        <button onClick={() => { 
                          setOrderStartDate(''); 
                          setOrderEndDate(''); 
                          setOrderStatusFilter('');
                          // Fetch directly with empty params to avoid stale state in same tick
                          const resCall = async () => {
                            try {
                              const res = await fetch(`${BACKEND_URL}/api/admin/orders`, { headers: getHeaders() });
                              if (res.ok) setOrders(await res.json());
                            } catch (e) { console.error(e); }
                          };
                          resCall();
                        }} className="btn btn-outline-secondary btn-sm">Bỏ lọc</button>
                      )}
                    </div>

                    {/* Delivery Assignment Modal Form */}
                    {assigningOrderId && (
                      <div className="bg-black p-3 rounded border border-primary mb-4">
                        <h6 className="text-primary mb-3">Phân công giao hàng cho đơn #{assigningOrderId.substring(0,8).toUpperCase()}</h6>
                        <form onSubmit={handleAssignDelivery} className="d-flex gap-2">
                          <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={deliveryStaffName} onChange={(e) => setDeliveryStaffName(e.target.value)} placeholder="Tên nhân viên giao hàng..." />
                          <button type="submit" className="btn btn-primary btn-sm px-3">Xác nhận giao hàng</button>
                          <button type="button" onClick={() => setAssigningOrderId(null)} className="btn btn-outline-secondary btn-sm">Hủy</button>
                        </form>
                      </div>
                    )}

                    <div className="table-responsive rounded border border-secondary bg-black">
                      <table className="table table-dark table-striped align-middle fs-7 m-0">
                        <thead>
                          <tr>
                            <th className="ps-3">Mã đơn</th>
                            <th>Người mua</th>
                            <th>Khách hàng</th>
                            <th>Tổng tiền</th>
                            <th>Ngày đặt</th>
                            <th>Trạng thái</th>
                            <th>Thanh toán</th>
                            <th>Công nợ COD</th>
                            <th>Shipper</th>
                            <th className="text-center" style={{ width: '180px' }}>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o, i) => (
                            <tr key={i}>
                              <td className="ps-3">#{o.id.substring(0, 8).toUpperCase()}</td>
                              <td>
                                {o.user ? (
                                  <>
                                    <strong className="d-block text-white">{o.user.fullName}</strong>
                                    <small className="text-secondary">{o.user.email}</small>
                                  </>
                                ) : (
                                  <span className="text-secondary">Khách vãng lai</span>
                                )}
                              </td>
                              <td>
                                <strong className="d-block text-white">{o.customerName}</strong>
                                <small className="text-secondary">{o.customerPhone}</small>
                              </td>
                              <td className="text-primary fw-bold">{new Intl.NumberFormat('vi-VN').format(o.totalAmount)}đ</td>
                              <td>{formatDate(o.createdAt)}</td>
                              <td>
                                {o.orderStatus === 'PENDING' && <span className="badge bg-warning text-black">Chờ duyệt</span>}
                                {o.orderStatus === 'APPROVED' && <span className="badge bg-info text-black">Đã duyệt</span>}
                                {o.orderStatus === 'SHIPPING' && <span className="badge bg-primary">Đang giao</span>}
                                {o.orderStatus === 'DELIVERED' && <span className="badge bg-success">Đã giao</span>}
                                {o.orderStatus === 'CANCELLED' && <span className="badge bg-danger">Hủy</span>}
                              </td>
                              <td><span className={o.paymentStatus==='PAID'?'text-success':'text-warning'}>{o.paymentStatus === 'PAID' ? 'Đã thu' : 'Chưa thu'}</span></td>
                              <td>{o.isDebt ? <span className="text-danger fw-bold">Nợ: Shipper</span> : <span className="text-secondary">-</span>}</td>
                              <td>{o.deliveryStaff || '-'}</td>
                              <td className="text-center">
                                {o.orderStatus === 'PENDING' && (
                                  <div className="d-flex gap-1 justify-content-center">
                                    <button onClick={() => setAssigningOrderId(o.id)} className="btn btn-success btn-xs">Duyệt & Giao</button>
                                    <button onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')} className="btn btn-danger btn-xs">Hủy</button>
                                  </div>
                                )}
                                {o.orderStatus === 'SHIPPING' && (
                                  <div className="d-flex gap-1 justify-content-center">
                                    <button onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')} className="btn btn-success btn-xs">Thành công</button>
                                    <button onClick={() => handleUpdateOrderStatus(o.id, 'CANCELLED')} className="btn btn-danger btn-xs">Thất bại</button>
                                  </div>
                                )}
                                {o.isDebt && (
                                  <button onClick={() => handleCollectDebt(o.id)} className="btn btn-primary btn-xs w-100">Thu tiền COD</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* ==========================================
                    4. USERS PANEL (Quản lý người dùng)
                   ========================================== */}
                {activeTab === 'users' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                      <h4 className="text-white text-uppercase fs-6 m-0">Quản lý người dùng</h4>
                      <button onClick={() => { clearUserForm(); setUserModalOpen(true); }} className="btn btn-primary btn-sm">➕ Thêm người dùng mới</button>
                    </div>

                    {/* User Add/Edit Form */}
                    {userModalOpen && (
                      <form onSubmit={handleUserSubmit} className="mb-5 bg-black p-4 rounded border border-primary">
                        <h5 className="text-primary fs-7 mb-3">{selectedUser ? `Chỉnh sửa: ${selectedUser.email}` : 'Thêm tài khoản người dùng mới'}</h5>
                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Họ và tên</label>
                            <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={usrFullName} onChange={(e) => setUsrFullName(e.target.value)} placeholder="Nguyễn Văn A" />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Email đăng nhập</label>
                            <input type="email" className="form-control bg-dark border-secondary text-white fs-7" required disabled={!!selectedUser} value={usrEmail} onChange={(e) => setUsrEmail(e.target.value)} placeholder="user@gmail.com" />
                          </div>
                          {!selectedUser && (
                            <div className="col-md-4 mb-3">
                              <label className="form-label fs-8 text-secondary">Mật khẩu</label>
                              <input type="password" className="form-control bg-dark border-secondary text-white fs-7" required value={usrPassword} onChange={(e) => setUsrPassword(e.target.value)} placeholder="Nhập mật khẩu..." />
                            </div>
                          )}
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Số điện thoại</label>
                            <input type="tel" className="form-control bg-dark border-secondary text-white fs-7" required value={usrPhone} onChange={(e) => setUsrPhone(e.target.value)} placeholder="0901234567" />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Ngày sinh</label>
                            <input type="date" className="form-control bg-dark border-secondary text-white fs-7" required value={usrDob} onChange={(e) => setUsrDob(e.target.value)} />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Hạng thẻ thành viên</label>
                            <select className="form-select bg-dark border-secondary text-white fs-7" value={usrRank} onChange={(e: any) => setUsrRank(e.target.value)}>
                              <option value="SILVER">Thẻ Bạc (SILVER)</option>
                              <option value="GOLD">Thẻ Vàng (GOLD)</option>
                              <option value="PLATINUM">Thẻ Bạch Kim (PLATINUM)</option>
                            </select>
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Doanh số mua tích lũy (VNĐ)</label>
                            <input type="number" className="form-control bg-dark border-secondary text-white fs-7" value={usrLoyaltyPoints} onChange={(e) => setUsrLoyaltyPoints(e.target.value)} placeholder="Ví dụ: 50000000" />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Tiền ký quỹ (VNĐ)</label>
                            <input type="number" className="form-control bg-dark border-secondary text-white fs-7" value={usrDeposit} onChange={(e) => setUsrDeposit(e.target.value)} placeholder="0" />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fs-8 text-secondary">Vai trò</label>
                            <select className="form-select bg-dark border-secondary text-white fs-7" value={usrRole} onChange={(e: any) => setUsrRole(e.target.value)}>
                              <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                              <option value="ADMIN">Quản trị viên (ADMIN)</option>
                            </select>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fs-8 text-secondary">Địa chỉ giao hàng 1</label>
                            <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={usrAddress} onChange={(e) => setUsrAddress(e.target.value)} placeholder="Địa chỉ chính..." />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fs-8 text-secondary">Địa chỉ giao hàng 2</label>
                            <input type="text" className="form-control bg-dark border-secondary text-white fs-7" value={usrAddress2} onChange={(e) => setUsrAddress2(e.target.value)} placeholder="Địa chỉ dự phòng..." />
                          </div>
                          <div className="col-md-12 mb-3">
                            <label className="form-label fs-8 text-secondary">Tài khoản ngân hàng liên kết</label>
                            <input type="text" className="form-control bg-dark border-secondary text-white fs-7" value={usrBankAccount} onChange={(e) => setUsrBankAccount(e.target.value)} placeholder="Ví dụ: Techcombank - 1902834789..." />
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-2">
                          <button type="submit" className="btn btn-primary btn-sm px-4">{selectedUser ? 'Cập nhật' : 'Thêm mới'}</button>
                          <button type="button" onClick={() => { setUserModalOpen(false); clearUserForm(); }} className="btn btn-outline-secondary btn-sm">Hủy</button>
                        </div>
                      </form>
                    )}

                    {/* Reset Password Form */}
                    {userPasswordResetOpen && selectedUser && (
                      <form onSubmit={handleResetPasswordSubmit} className="mb-5 bg-black p-4 rounded border border-warning">
                        <h5 className="text-warning fs-7 mb-3">Đặt lại mật khẩu cho: {selectedUser.fullName} ({selectedUser.email})</h5>
                        <div className="row align-items-end g-3">
                          <div className="col-md-8">
                            <label className="form-label fs-8 text-secondary">Mật khẩu mới</label>
                            <input type="password" className="form-control bg-dark border-secondary text-white fs-7" required value={usrNewPassword} onChange={(e) => setUsrNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới..." />
                          </div>
                          <div className="col-md-4 d-flex gap-2">
                            <button type="submit" className="btn btn-warning btn-sm w-100">Xác nhận</button>
                            <button type="button" onClick={() => { setUserPasswordResetOpen(false); setUsrNewPassword(''); }} className="btn btn-outline-secondary btn-sm w-100">Hủy</button>
                          </div>
                        </div>
                      </form>
                    )}

                    <div className="table-responsive rounded border border-secondary bg-black">
                      <table className="table table-dark table-striped align-middle fs-7 m-0">
                        <thead>
                          <tr>
                            <th className="ps-3">Họ tên / Email</th>
                            <th>SĐT</th>
                            <th>Vai trò / Hạng</th>
                            <th>Ký quỹ</th>
                            <th>Thông tin phụ</th>
                            <th>Trạng thái</th>
                            <th className="text-center" style={{ width: '220px' }}>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u, i) => (
                            <tr key={i}>
                              <td className="ps-3">
                                <strong className="text-white d-block">{u.fullName}</strong>
                                <small className="text-secondary">{u.email}</small>
                              </td>
                              <td>{u.phone}</td>
                              <td>
                                <span className={`badge ${u.role==='ADMIN'?'bg-primary':'bg-secondary'} me-1`}>{u.role}</span>
                                {u.role === 'CUSTOMER' && <span className="badge bg-dark border border-secondary text-secondary">{u.rank}</span>}
                              </td>
                              <td className="text-warning fw-bold">{new Intl.NumberFormat('vi-VN').format(u.deposit || 0)}đ</td>
                              <td>
                                <small className="d-block text-secondary text-truncate" style={{ maxWidth: '180px' }} title={u.address2 || ''}>ĐC2: {u.address2 || '-'}</small>
                                <small className="d-block text-secondary text-truncate" style={{ maxWidth: '180px' }} title={u.bankAccount || ''}>NH: {u.bankAccount || '-'}</small>
                              </td>
                              <td>
                                {u.isLocked ? <span className="text-danger">Đã khóa</span> : <span className="text-success">Hoạt động</span>}
                              </td>
                              <td className="text-center">
                                <button onClick={() => handleEditUserClick(u)} className="btn btn-link text-primary btn-sm p-0 me-2">Sửa</button>
                                <button onClick={() => { setSelectedUser(u); setUserPasswordResetOpen(true); }} className="btn btn-link text-warning btn-sm p-0 me-2">Đổi MK</button>
                                {u.role !== 'ADMIN' && (
                                  <button 
                                    onClick={() => handleToggleLockUser(u.id, u.isLocked)} 
                                    className={`btn btn-link btn-sm p-0 ${u.isLocked ? 'text-success' : 'text-danger'}`}
                                  >
                                    {u.isLocked ? 'Mở' : 'Khóa'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ==========================================
                    5. COUPONS PANEL (Vouchers)
                   ========================================== */}
                {activeTab === 'coupons' && (
                  <div>
                    <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Mã khuyến mãi (Vouchers)</h4>
                    
                    {/* Add Coupon Form */}
                    <form onSubmit={handleCouponSubmit} className="mb-4 bg-black p-3 rounded border border-secondary">
                      <div className="row">
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Mã giảm giá</label>
                          <input type="text" className="form-control bg-dark border-secondary text-white fs-7 uppercase" required value={cpCode} onChange={(e) => setCpCode(e.target.value)} placeholder="SALE10" />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label fs-8 text-secondary">Loại giảm</label>
                          <select className="form-select bg-dark border-secondary text-white fs-7" value={cpType} onChange={(e: any) => setCpType(e.target.value)}>
                            <option value="PERCENTAGE">% Giảm</option>
                            <option value="FIXED">Số tiền cố định (VNĐ)</option>
                          </select>
                        </div>
                        <div className="col-md-2 mb-3">
                          <label className="form-label fs-8 text-secondary">Giá trị giảm</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white fs-7" required value={cpValue} onChange={(e) => setCpValue(e.target.value)} />
                        </div>
                        <div className="col-md-2 mb-3">
                          <label className="form-label fs-8 text-secondary">Lượt dùng tối đa</label>
                          <input type="number" className="form-control bg-dark border-secondary text-white fs-7" required value={cpMaxUsage} onChange={(e) => setCpMaxUsage(e.target.value)} />
                        </div>
                        <div className="col-md-2 mb-3">
                          <label className="form-label fs-8 text-secondary">Hạn sử dụng</label>
                          <input type="date" className="form-control bg-dark border-secondary text-white fs-7" required value={cpExpiry} onChange={(e) => setCpExpiry(e.target.value)} />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm px-4">Tạo mã giảm giá</button>
                    </form>

                    <div className="table-responsive rounded border border-secondary bg-black">
                      <table className="table table-dark table-striped align-middle fs-7 m-0">
                        <thead>
                          <tr>
                            <th className="ps-3">Mã giảm</th>
                            <th>Loại</th>
                            <th>Giá trị giảm</th>
                            <th>Đã dùng</th>
                            <th>Lượt dùng tối đa</th>
                            <th>Hết hạn</th>
                            <th className="text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((c, i) => (
                            <tr key={i}>
                              <td className="ps-3 fw-bold text-white">{c.code}</td>
                              <td>{c.discountType === 'PERCENTAGE' ? '% Giảm' : 'Tiền cố định'}</td>
                              <td className="text-primary fw-bold">
                                {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(c.discountValue)}đ`}
                              </td>
                              <td>{c.usedCount}</td>
                              <td>{c.maxUsage}</td>
                              <td>{new Date(c.expiryDate).toLocaleDateString('vi-VN')}</td>
                              <td className="text-center">
                                <button onClick={() => handleDeleteCoupon(c.id)} className="btn btn-link text-danger btn-sm p-0">Xóa</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* ==========================================
                    6. CSKH Panel (Duyệt Đánh giá & Hỏi đáp)
                   ========================================== */}
                {activeTab === 'cskh' && (
                  <div>
                    <h4 className="text-white text-uppercase fs-6 mb-4 pb-2 border-bottom border-secondary">Duyệt Đánh giá & Hỏi đáp câu hỏi khách hàng</h4>
                    
                    {/* Answer QnA form */}
                    {answeringQnaId && (
                      <div className="bg-black p-3 rounded border border-primary mb-4">
                        <h6 className="text-primary mb-2">Trả lời hỏi đáp của khách hàng</h6>
                        <form onSubmit={handleAnswerQnaSubmit}>
                          <div className="mb-3">
                            <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={qnaAnswerText} onChange={(e) => setQnaAnswerText(e.target.value)} placeholder="Nhập câu trả lời giải đáp thắc mắc..." />
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary btn-sm px-3">Gửi câu trả lời</button>
                            <button type="button" onClick={() => setAnsweringQnaId(null)} className="btn btn-outline-secondary btn-sm">Hủy</button>
                          </div>
                        </form>
                      </div>
                    )}

                    <nav className="mb-4">
                      <div className="nav nav-tabs border-secondary" id="admin-tab" role="tablist">
                        <button className="nav-link active bg-transparent text-white border-secondary" id="admin-qna-tab" data-bs-toggle="tab" data-bs-target="#admin-qna" type="button" role="tab">Hỏi đáp</button>
                        <button className="nav-link bg-transparent text-white border-secondary" id="admin-review-tab" data-bs-toggle="tab" data-bs-target="#admin-review" type="button" role="tab">Đánh giá sản phẩm</button>
                      </div>
                    </nav>

                    <div className="tab-content" id="admin-tabContent">
                      {/* QnA Tab list */}
                      <div className="tab-pane fade show active" id="admin-qna" role="tabpanel">
                        <div className="d-flex flex-column gap-3">
                          {qnas.length === 0 && <p className="text-secondary fs-7 text-center py-4">Chưa có câu hỏi nào.</p>}
                          {qnas.map((q, i) => (
                            <div key={i} className="bg-black p-3 rounded border border-secondary">
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-8 text-secondary">Khách hàng: <strong>{q.user?.fullName}</strong> | Sản phẩm: <strong>{q.product?.name}</strong></span>
                                <button onClick={() => handleDeleteQna(q.id)} className="btn btn-link text-danger btn-sm p-0">Xóa</button>
                              </div>
                              <p className="fs-7 text-white fw-bold mt-2 mb-1">❓ {q.question}</p>
                              {q.answer ? (
                                <p className="fs-7 text-success mt-1 mb-0 ps-3">💡 {q.answer}</p>
                              ) : (
                                <button onClick={() => { setAnsweringQnaId(q.id); setQnaAnswerText(''); }} className="btn btn-primary btn-xs mt-2">Trả lời ngay</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reviews Tab list */}
                      <div className="tab-pane fade" id="admin-review" role="tabpanel">
                        <div className="table-responsive rounded border border-secondary bg-black">
                          <table className="table table-dark table-striped align-middle fs-7 m-0">
                            <thead>
                              <tr>
                                <th className="ps-3">Người dùng</th>
                                <th>Sản phẩm</th>
                                <th>Đánh giá sao</th>
                                <th>Nội dung bình luận</th>
                                <th>Hiển thị Web</th>
                                <th>Xóa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reviews.map((r, i) => (
                                <tr key={i}>
                                  <td className="ps-3">{r.user?.fullName}</td>
                                  <td className="text-truncate" style={{ maxWidth: '150px' }}>{r.product?.name}</td>
                                  <td className="text-warning">{'★'.repeat(r.rating) + '☆'.repeat(5-r.rating)}</td>
                                  <td>{r.comment}</td>
                                  <td>
                                    <div className="form-check form-switch">
                                      <input className="form-check-input" type="checkbox" checked={r.isApproved} onChange={() => handleToggleReview(r.id, r.isApproved)} />
                                    </div>
                                  </td>
                                  <td>
                                    {/* Delete action can be routed or we just toggle hide/show */}
                                    <button onClick={() => handleToggleReview(r.id, true)} className="btn btn-link text-danger btn-sm p-0">Xóa</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ==========================================
                    7. ADMIN LIVE CHAT PANEL
                   ========================================== */}
                {activeTab === 'chat' && (
                  <div className="row g-0 rounded border border-secondary overflow-hidden bg-black" style={{ height: '550px' }}>
                    {/* Customer chat list sidebar */}
                    <div className="col-md-4 border-end border-secondary bg-dark d-flex flex-column" style={{ height: '100%' }}>
                      <div className="p-3 bg-black border-bottom border-secondary">
                        <h6 className="m-0 text-white fw-bold">Danh sách hội thoại</h6>
                      </div>
                      <div className="flex-grow-1 overflow-y-auto">
                        {conversations.length === 0 && (
                          <p className="text-secondary fs-8 text-center mt-5">Chưa có khách hàng nhắn tin.</p>
                        )}
                        {conversations.map((conv, i) => (
                          <div 
                            key={i} 
                            onClick={() => handleSelectCustomerChat(conv.userId)}
                            className={`p-3 border-bottom border-dark cursor-pointer transition-all hover-bg-dark ${conv.userId === activeCustomerId ? 'bg-black border-start border-primary border-4' : ''}`}
                          >
                            <strong className="d-block text-white fs-7">{conv.fullName}</strong>
                            <small className="text-secondary fs-8 text-truncate d-block mt-1">{conv.lastMessage}</small>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat Box panel */}
                    <div className="col-md-8 d-flex flex-column bg-black" style={{ height: '100%' }}>
                      {activeCustomerId ? (
                        <>
                          {/* Chat Title bar */}
                          <div className="p-3 bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center">
                            <strong className="text-white fs-7">
                              Chat với: {conversations.find(c => c.userId === activeCustomerId)?.fullName}
                            </strong>
                          </div>

                          {/* Messages */}
                          <div className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-2" style={{ minHeight: 0 }}>
                            {chatMessages.map((msg, index) => {
                              const isMe = msg.sender?.role === 'ADMIN';
                              return (
                                <div 
                                  key={index}
                                  className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}
                                >
                                  <span className="text-secondary mb-1" style={{ fontSize: '0.65rem' }}>
                                    {isMe ? 'Bạn (Admin)' : msg.sender?.fullName || 'Khách hàng'}
                                  </span>
                                  <div 
                                    className={`p-2 rounded-3 fs-7 max-w-85 ${isMe ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                                    style={{ wordBreak: 'break-word' }}
                                  >
                                    {msg.message}
                                  </div>
                                </div>
                              );
                            })}

                            {isCustomerTyping && (
                              <div className="d-flex flex-column align-items-start">
                                <span className="text-secondary mb-1" style={{ fontSize: '0.65rem' }}>Khách hàng</span>
                                <div className="p-2 rounded-3 fs-7 bg-secondary text-gray-400 italic">
                                  Khách hàng đang nhập tin nhắn...
                                </div>
                              </div>
                            )}

                            <div ref={chatEndRef} />
                          </div>

                          {/* Input Bar */}
                          <div className="p-3 border-top border-secondary bg-dark">
                            <form onSubmit={handleAdminSendChat} className="d-flex gap-2">
                              <input 
                                type="text" 
                                className="form-control bg-black border-secondary text-white fs-7" 
                                placeholder="Nhập câu trả lời của admin..."
                                value={adminChatInput}
                                onChange={handleAdminChatInputChange}
                              />
                              <button type="submit" className="btn btn-primary btn-sm px-4">Gửi</button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <div className="my-auto text-center text-secondary">
                          <p className="fs-5 mb-0">💬 Chọn một khách hàng bên trái để bắt đầu chat hỗ trợ trực tuyến.</p>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* ── WARRANTY MANAGEMENT TAB ── */}
                {activeTab === 'warranties' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="text-uppercase m-0 text-white border-start border-primary border-4 ps-3">Quản lý Bảo hành Điện tử</h5>
                    </div>

                    {/* Filter bar */}
                    <div className="bg-dark p-3 rounded border border-secondary mb-4">
                      <div className="row g-2 align-items-center">
                        <div className="col-md-5">
                          <input 
                            type="text" 
                            className="form-control form-control-sm bg-black border-secondary text-white" 
                            placeholder="Tìm theo Mã BH, SĐT, Tên khách hàng..." 
                            value={warrantyQueryFilter}
                            onChange={(e) => setWarrantyQueryFilter(e.target.value)}
                          />
                        </div>
                        <div className="col-md-4">
                          <select 
                            className="form-select form-select-sm bg-black border-secondary text-white"
                            value={warrantyStatusFilter}
                            onChange={(e) => setWarrantyStatusFilter(e.target.value)}
                          >
                            <option value="">-- Tất cả trạng thái --</option>
                            <option value="ACTIVE">Đang hiệu lực (ACTIVE)</option>
                            <option value="CLAIMED">Đang tiếp nhận/bảo hành (CLAIMED)</option>
                            <option value="EXPIRED">Hết hạn (EXPIRED)</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <button onClick={fetchAdminWarranties} className="btn btn-primary btn-sm w-100">
                            🔍 Lọc dữ liệu
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form Modal */}
                    {editingWarranty && (
                      <div className="bg-dark p-4 rounded border border-primary mb-4">
                        <h6 className="text-primary mb-3">✏️ Cập nhật bảo hành: <span className="text-white fw-bold">{editingWarranty.warrantyCode}</span></h6>
                        <form onSubmit={handleUpdateWarrantySubmit}>
                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label text-secondary fs-8 mb-1">Sản phẩm bảo hành</label>
                              <input type="text" className="form-control form-control-sm bg-black border-secondary text-white" disabled value={editingWarranty.product?.name || ''} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label text-secondary fs-8 mb-1">Khách hàng / SĐT</label>
                              <input type="text" className="form-control form-control-sm bg-black border-secondary text-white" disabled value={`${editingWarranty.customerName} (${editingWarranty.customerPhone})`} />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label text-secondary fs-8 mb-1">Trạng thái bảo hành</label>
                              <select className="form-select form-select-sm bg-black border-secondary text-white" value={wrtStatus} onChange={(e: any) => setWrtStatus(e.target.value)}>
                                <option value="ACTIVE">ACTIVE - Đang hiệu lực</option>
                                <option value="CLAIMED">CLAIMED - Đang bảo hành/sửa chữa</option>
                                <option value="EXPIRED">EXPIRED - Hết hạn bảo hành</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label text-secondary fs-8 mb-1">Ghi chú tình trạng / sửa chữa</label>
                              <input type="text" className="form-control form-control-sm bg-black border-secondary text-white" value={wrtNotes} onChange={(e) => setWrtNotes(e.target.value)} placeholder="Nhập ghi chú sửa chữa, tình trạng máy..." />
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-success btn-sm px-4">Lưu cập nhật</button>
                            <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setEditingWarranty(null)}>Hủy</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Table */}
                    <div className="table-responsive rounded border border-secondary bg-black">
                      <table className="table table-dark table-hover align-middle m-0 fs-7">
                        <thead>
                          <tr>
                            <th>Mã bảo hành</th>
                            <th>Sản phẩm</th>
                            <th>Khách hàng</th>
                            <th>Thời hạn</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th className="text-end">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warranties.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-secondary py-4">Chưa có dữ liệu bảo hành nào.</td>
                            </tr>
                          ) : (
                            warranties.map((w) => (
                              <tr key={w.id}>
                                <td className="fw-bold text-primary">{w.warrantyCode}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    {w.product?.imageUrl && <img src={w.product.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />}
                                    <span>{w.product?.name}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="fw-bold">{w.customerName}</div>
                                  <small className="text-secondary">{w.customerPhone}</small>
                                </td>
                                <td>
                                  <div className="text-secondary fs-8">Kích hoạt: {formatDate(w.startDate)}</div>
                                  <div className="text-danger fw-bold fs-8">Hết hạn: {formatDate(w.endDate)}</div>
                                </td>
                                <td>
                                  {w.status === 'ACTIVE' && <span className="badge bg-success">Đang hiệu lực</span>}
                                  {w.status === 'CLAIMED' && <span className="badge bg-warning text-black">Đang bảo hành</span>}
                                  {w.status === 'EXPIRED' && <span className="badge bg-danger">Hết hạn</span>}
                                </td>
                                <td>{w.notes || '-'}</td>
                                <td className="text-end">
                                  <button 
                                    className="btn btn-outline-info btn-xs"
                                    onClick={() => {
                                      setEditingWarranty(w);
                                      setWrtStatus(w.status);
                                      setWrtNotes(w.notes || '');
                                    }}
                                  >
                                    ✏️ Sửa
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
        .btn-xs {
          padding: 2px 8px;
          font-size: 0.7rem;
          border-radius: 4px;
        }
        .btn-xs.w-100 {
          display: block;
        }
        .hover-bg-dark:hover {
          background-color: #1a1a1a !important;
        }
        .max-w-85 {
          max-width: 85%;
        }
      `}</style>
    </>
  );
}

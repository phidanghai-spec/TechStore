'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BACKEND_URL;

type ChatMode = 'ai' | 'admin';

interface Message {
  id?: string;
  senderId?: string;
  senderName?: string;
  role?: 'user' | 'assistant';
  message?: string;
  content?: string;
  sender?: { fullName: string; role: string };
  createdAt?: string;
  isAI?: boolean;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('ai');

  // Shared
  const [user, setUser] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Admin Chat state
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [guestUserId, setGuestUserId] = useState<string | null>(null); // UUID thật từ server
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, adminMessages, isAiLoading, isAdminTyping]);

  // Load user data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setCustomerName(parsedUser.fullName);
        setCustomerEmail(parsedUser.email);
        setIsRegistered(true);
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  // Initialize admin socket when switching to admin mode
  useEffect(() => {
    if (chatMode !== 'admin' || !isOpen || !isRegistered || !customerName) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    const roomId = user?.id || customerEmail || 'guest_room';
    socket.emit('join_room', roomId);

    // Fetch admin chat history
    if (user) {
      fetch(`${BACKEND_URL}/api/chats/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(history => setAdminMessages(history))
        .catch(console.error);
    }

    socket.on('receive_message', (msg: any) => {
      setAdminMessages(prev => [...prev, msg]);
    });

    // Nhận UUID thật của guest user từ server
    socket.on('guest_registered', (data: { userId: string }) => {
      setGuestUserId(data.userId);
    });

    socket.on('typing_status', (data: { isTyping: boolean; senderName: string }) => {
      if (data.senderName !== customerName) {
        setIsAdminTyping(data.isTyping);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatMode, isOpen, isRegistered, customerName, user]);

  // ─── AI CHAT HANDLER ────────────────────────────────────────────
  const handleAiSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || isAiLoading) return;

    const newUserMsg = { role: 'user' as const, content: text };
    const updatedHistory = [...aiMessages, newUserMsg];
    setAiMessages(updatedHistory);
    setInputMessage('');
    setIsAiLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: aiMessages.slice(-8) // gửi 8 tin nhắn gần nhất
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.'
        }]);
      }
    } catch {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Không thể kết nối tới AI. Vui lòng kiểm tra kết nối mạng hoặc chuyển sang chat với admin.'
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ─── ADMIN CHAT HANDLER ─────────────────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim() && customerEmail.trim()) setIsRegistered(true);
  };

  const handleAdminSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socketRef.current) return;

    const roomId = user?.id || customerEmail || 'guest_room';
    socketRef.current.emit('send_message', {
      senderId: user?.id || customerEmail,
      senderName: customerName || 'Khách vãng lai',
      senderEmail: customerEmail || 'guest@techstore.vn',
      receiverId: 'admin_placeholder',
      message: inputMessage.trim(),
      roomId
    });
    socketRef.current.emit('typing', { roomId, isTyping: false, senderName: customerName });
    setInputMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (chatMode === 'admin' && socketRef.current) {
      const roomId = user?.id || customerEmail || 'guest_room';
      socketRef.current.emit('typing', {
        roomId,
        isTyping: e.target.value.length > 0,
        senderName: customerName
      });
    }
  };

  const handleSend = chatMode === 'ai' ? handleAiSend : handleAdminSend;

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <>
      {/* Floating Chat Button */}
      <div onClick={() => setIsOpen(!isOpen)} className="chat-widget-btn">
        {isOpen ? '✕' : '💬'}
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="chat-popup d-flex flex-column" style={{ fontFamily: 'inherit' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)' }} className="text-white p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.2rem' }}>{chatMode === 'ai' ? '🤖' : '👨‍💼'}</span>
                <div>
                  <h6 className="m-0 fw-bold" style={{ fontSize: '0.85rem' }}>
                    {chatMode === 'ai' ? 'TechBot AI' : 'Hỗ trợ trực tuyến'}
                  </h6>
                  <small style={{ opacity: 0.85, fontSize: '0.7rem' }}>
                    {chatMode === 'ai' ? '🟢 Trả lời tự động 24/7' : '🟡 Admin sẽ phản hồi sớm'}
                  </small>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="btn-close btn-close-white btn-sm" aria-label="Close" />
            </div>
            {/* Mode Toggle */}
            <div className="d-flex gap-1">
              <button
                onClick={() => { setChatMode('ai'); setInputMessage(''); }}
                className={`btn btn-sm flex-fill py-1 ${chatMode === 'ai' ? 'btn-light text-primary fw-bold' : 'btn-outline-light'}`}
                style={{ fontSize: '0.7rem', borderRadius: '20px' }}
              >
                🤖 Chat với AI
              </button>
              <button
                onClick={() => { setChatMode('admin'); setInputMessage(''); }}
                className={`btn btn-sm flex-fill py-1 ${chatMode === 'admin' ? 'btn-light text-primary fw-bold' : 'btn-outline-light'}`}
                style={{ fontSize: '0.7rem', borderRadius: '20px' }}
              >
                👨‍💼 Chat với Admin
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column bg-dark" style={{ minHeight: 0 }}>

            {/* ── AI MODE ── */}
            {chatMode === 'ai' && (
              <div className="d-flex flex-column gap-2 flex-grow-1">
                {aiMessages.length === 0 && (
                  <div className="my-auto text-center">
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🤖</div>
                    <p className="text-secondary fs-8 mb-3">Xin chào! Tôi là <strong className="text-primary">TechBot</strong> - trợ lý AI của TechStore.</p>
                    <div className="d-flex flex-column gap-2">
                      {[
                        'iPhone 16 Pro Max giá bao nhiêu?',
                        'So sánh MacBook Air M3 vs M2',
                        'Laptop gaming tầm 20 triệu nên mua gì?'
                      ].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInputMessage(q);
                          }}
                          className="btn btn-outline-secondary btn-sm text-start text-white"
                          style={{ fontSize: '0.7rem', borderRadius: '12px' }}
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {aiMessages.map((msg, i) => (
                  <div key={i} className={`d-flex flex-column ${msg.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                    <span className="text-secondary mb-1" style={{ fontSize: '0.62rem' }}>
                      {msg.role === 'user' ? 'Bạn' : '🤖 TechBot'}
                    </span>
                    <div
                      className={`p-2 rounded-3 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary bg-opacity-25 text-white border border-secondary'}`}
                      style={{ wordBreak: 'break-word', maxWidth: '88%', fontSize: '0.78rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="d-flex flex-column align-items-start">
                    <span className="text-secondary mb-1" style={{ fontSize: '0.62rem' }}>🤖 TechBot</span>
                    <div className="p-2 rounded-3 bg-secondary bg-opacity-25 border border-secondary d-flex gap-1 align-items-center">
                      <span className="text-secondary" style={{ fontSize: '0.7rem' }}>Đang suy nghĩ</span>
                      <span style={{ animation: 'blink 1.4s infinite', opacity: 0.6 }}>●●●</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* ── ADMIN MODE ── */}
            {chatMode === 'admin' && (
              !isRegistered ? (
                <form onSubmit={handleRegister} className="my-auto">
                  <p className="text-secondary fs-8 text-center mb-4">Nhập thông tin để bắt đầu trò chuyện với admin TechStore.</p>
                  <div className="mb-3">
                    <label className="form-label fs-8 text-white">Họ và tên</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fs-8 text-white">Email hoặc Số điện thoại</label>
                    <input type="text" className="form-control bg-dark border-secondary text-white fs-7" required value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <button type="submit" className="w-100 btn btn-primary btn-sm">Bắt đầu chat</button>
                </form>
              ) : (
                <div className="d-flex flex-column gap-2 flex-grow-1">
                  {adminMessages.length === 0 && (
                    <p className="text-secondary fs-8 text-center my-auto">👋 Chào {customerName}! Admin sẽ phản hồi sớm nhất có thể.</p>
                  )}
                  {adminMessages.map((msg, i) => {
                    const isMe = msg.senderId === (user?.id || guestUserId);
                    return (
                      <div key={i} className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                        <span className="text-secondary mb-1" style={{ fontSize: '0.62rem' }}>
                          {isMe ? 'Bạn' : msg.sender?.fullName || '👨‍💼 Admin'}
                        </span>
                        <div
                          className={`p-2 rounded-3 ${isMe ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                          style={{ wordBreak: 'break-word', maxWidth: '88%', fontSize: '0.78rem' }}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                  {isAdminTyping && (
                    <div className="d-flex flex-column align-items-start">
                      <span className="text-secondary mb-1" style={{ fontSize: '0.62rem' }}>👨‍💼 Admin</span>
                      <div className="p-2 rounded-3 bg-secondary text-white" style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                        Đang nhập...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )
            )}
          </div>

          {/* Footer */}
          {(chatMode === 'ai' || (chatMode === 'admin' && isRegistered)) && (
            <div className="p-2 border-top border-secondary bg-black">
              <form onSubmit={handleSend} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm bg-dark border-secondary text-white"
                  placeholder={chatMode === 'ai' ? 'Hỏi TechBot về sản phẩm...' : 'Nhập tin nhắn...'}
                  value={inputMessage}
                  onChange={handleInputChange}
                  disabled={isAiLoading}
                  style={{ fontSize: '0.78rem' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-3"
                  disabled={isAiLoading || !inputMessage.trim()}
                >
                  {isAiLoading ? '⏳' : '➤'}
                </button>
              </form>
              <p className="text-secondary text-center m-0 mt-1" style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                {chatMode === 'ai' ? '🤖 Powered by Claude AI • Thông tin có thể sai, xác nhận với admin' : '⚡ Chat thời gian thực'}
              </p>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

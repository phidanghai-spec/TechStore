'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAdminTyping]);

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

  // Initialize Socket connection
  useEffect(() => {
    if (!isOpen || !isRegistered || !customerName) return;

    // Connect to Socket.io Server
    const socket = io(BACKEND_URL, {
      withCredentials: true
    });
    socketRef.current = socket;

    // Determine roomId (if customer is logged in, use userId. If guest, use customerEmail as roomId)
    const roomId = user?.id || customerEmail || 'guest_room';
    
    // Join room
    socket.emit('join_room', roomId);

    // Fetch message history from API
    const fetchChatHistory = async () => {
      try {
        // If logged in, fetch from API. If guest, we just rely on active session.
        if (user) {
          const response = await fetch(`${BACKEND_URL}/api/chats/history`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const history = await response.json();
            setMessages(history);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    fetchChatHistory();

    // Listen for messages
    socket.on('receive_message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for typing status
    socket.on('typing_status', (data: { isTyping: boolean; senderName: string }) => {
      if (data.senderName !== customerName) {
        setIsAdminTyping(data.isTyping);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, isRegistered, customerName, user]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim() && customerEmail.trim()) {
      setIsRegistered(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socketRef.current) return;

    const roomId = user?.id || customerEmail || 'guest_room';
    const adminId = 'admin_placeholder'; // Placeholder, backend handles mapping

    socketRef.current.emit('send_message', {
      senderId: user?.id || customerEmail, // use email for guest identifier
      senderName: customerName || 'Khách vãng lai',
      senderEmail: customerEmail || 'guest@techstore.vn',
      receiverId: adminId,
      message: inputMessage.trim(),
      roomId
    });

    // Emit stop typing
    socketRef.current.emit('typing', {
      roomId,
      isTyping: false,
      senderName: customerName
    });

    setInputMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    if (!socketRef.current) return;
    const roomId = user?.id || customerEmail || 'guest_room';

    // Emit typing status
    socketRef.current.emit('typing', {
      roomId,
      isTyping: e.target.value.length > 0,
      senderName: customerName
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div onClick={() => setIsOpen(!isOpen)} className="chat-widget-btn">
        {isOpen ? '✕' : '💬'}
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="chat-popup d-flex flex-column">
          
          {/* Header */}
          <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
            <h6 className="m-0 fw-bold">Hỗ trợ TechStore</h6>
            <button onClick={() => setIsOpen(false)} className="btn-close btn-close-white btn-sm" aria-label="Close"></button>
          </div>

          {/* Body */}
          <div className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column bg-dark" style={{ minHeight: 0 }}>
            {!isRegistered ? (
              /* Name/Email Form for Guests */
              <form onSubmit={handleRegister} className="my-auto">
                <p className="text-secondary fs-7 text-center mb-4">Nhập thông tin của bạn để bắt đầu trò chuyện hỗ trợ trực tuyến với TechStore.</p>
                <div className="mb-3">
                  <label className="form-label fs-7 text-white">Họ và tên</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark border-secondary text-white fs-7" 
                    required 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fs-7 text-white">Email hoặc Số điện thoại</label>
                  <input 
                    type="text" 
                    className="form-control bg-dark border-secondary text-white fs-7" 
                    required 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <button type="submit" className="w-100 btn btn-primary btn-sm">Bắt đầu chat</button>
              </form>
            ) : (
              /* Message List */
              <div className="d-flex flex-column gap-2 flex-grow-1">
                {messages.length === 0 && (
                  <p className="text-secondary fs-8 text-center my-auto">Chào bạn! TechStore có thể giúp gì cho bạn hôm nay?</p>
                )}
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === (user?.id || customerEmail);
                  return (
                    <div 
                      key={index} 
                      className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}
                    >
                      <span className="text-secondary mb-1" style={{ fontSize: '0.65rem' }}>
                        {isMe ? 'Bạn' : msg.sender?.fullName || 'Hỗ trợ viên'}
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

                {/* Typing Indicator */}
                {isAdminTyping && (
                  <div className="d-flex flex-column align-items-start">
                    <span className="text-secondary mb-1" style={{ fontSize: '0.65rem' }}>Hỗ trợ viên</span>
                    <div className="p-2 rounded-3 fs-7 bg-secondary text-gray-400 italic">
                      Đang trả lời...
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer Input */}
          {isRegistered && (
            <div className="p-2 border-top border-secondary bg-black">
              <form onSubmit={handleSendMessage} className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm bg-dark border-secondary text-white fs-7" 
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={handleInputChange}
                />
                <button type="submit" className="btn btn-primary btn-sm px-3">Gửi</button>
              </form>
            </div>
          )}

        </div>
      )}
    </>
  );
}

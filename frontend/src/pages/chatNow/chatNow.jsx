import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./chatNow.css";

const ChatNow = () => {
    const { professionalId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);

    const professionalName = location.state?.professionalName || 'Professional';
    const professionalImage = location.state?.professionalImage || 'https://avatar.iran.liara.run/public/boy?username=Pro';
    const gigTitle = location.state?.gigTitle || '';

    const messageEndRef = useRef(null);

    // Setup socket connection
    useEffect(() => {
        if (!user) return;

        try {
            const token = localStorage.getItem('token');
            const newSocket = io('http://localhost:3000', {
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                auth: {
                    token
                },
                query: {
                    userId: user._id
                }
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setError(null);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                setError(`Connection error: ${err.message}. Trying to reconnect...`);
            });

            setSocket(newSocket);

            return () => {
                console.log('Closing socket');
                newSocket.disconnect();
            };
        } catch (err) {
            console.error("Socket setup error:", err);
            setError("Failed to establish chat connection");
        }
    }, [user]);

    // Check authentication and get user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate(`/login`, { state: { from: `/chat/${professionalId}` } });
            return;
        }

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));

            setUser({
                _id: payload._id,
                email: payload.email,
                fname: payload.fname,
                lname: payload.lname,
                image: payload.image
            });

            setError(null);
        } catch (err) {
            console.error("Error parsing token:", err);
            setError("Authentication failed. Please login again.");
            navigate(`/login`, { state: { from: `/chat/${professionalId}` } });
        }
    }, [professionalId, navigate]);

    // Fetch previous messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const conversationResponse = await axios.post(
                    'http://localhost:3000/conversations',
                    { participantId: professionalId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const conversationId = conversationResponse.data._id;

                const messagesResponse = await axios.get(
                    `http://localhost:3000/messages/${conversationId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setMessages(messagesResponse.data.messages || []);
                setError(null);
            } catch (err) {
                console.error("Error fetching messages:", err);
                setError("Failed to load messages. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMessages();
        }
    }, [professionalId, user]);

    // Listen for real-time incoming messages
    useEffect(() => {
        if (!socket || !user) return;

        socket.on('getMessage', (data) => {
            if (
                (data.senderId === professionalId && data.receiverId === user._id) ||
                (data.senderId === user._id && data.receiverId === professionalId)
            ) {
                setMessages(prev => [...prev, {
                    _id: Date.now().toString(),
                    sender: data.senderId,
                    content: data.content,
                    createdAt: new Date().toISOString()
                }]);
            }
        });

        return () => {
            socket.off('getMessage');
        };
    }, [socket, user, professionalId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
    
        // Check for valid message and socket connection
        if (!newMessage.trim() || !socket) {
            console.log("Cannot send: empty message or no socket connection");
            return;
        }
    
        try {
            // Create temporary message to show immediately
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: user._id,
                content: newMessage,
                createdAt: new Date().toISOString(),
                isTemp: true
            };
    
            // Save content before clearing the input
            const messageContent = newMessage;
            
            // Add to UI immediately
            setMessages(prev => [...prev, tempMessage]);
            
            // Clear input
            setNewMessage('');
    
            // Emit to socket for real-time updates
            socket.emit('sendMessage', {
                senderId: user._id,
                receiverId: professionalId,
                content: messageContent
            });
    
            // Send to server via API
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No authentication token found");
    
            const response = await axios.post(
                'http://localhost:3000/messages',
                {
                    receiverId: professionalId,
                    content: messageContent
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            console.log("Message sent successfully:", response.data);
    
            // Replace temp message with real message from server
            setMessages(prev => 
                prev.filter(msg => msg._id !== tempMessage._id)
                    .concat(response.data.message || response.data)
            );
    
        } catch (err) {
            console.error("Error sending message:", err);
            // Show the error in the UI
            setError(`Failed to send message: ${err.message}. Please try again.`);
            // Remove the temp message after short delay
            setTimeout(() => {
                setMessages(prev => prev.filter(msg => !msg.isTemp));
            }, 2000);
        }
    };

    if (loading && !user) return <div className="loading">Loading...</div>;

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="back-button" onClick={() => navigate(-1)}>
                    ← Back
                </div>
                <div className="chat-recipient">
                    <img 
                        src={professionalImage} 
                        alt={professionalName} 
                        className="recipient-avatar" 
                    />
                    <div className="recipient-info">
                        <h2>{professionalName}</h2>
                        {gigTitle && <p className="gig-title">{gigTitle}</p>}
                    </div>
                </div>
            </div>

            <div className="message-container">
                {error && <div className="error-message">{error}</div>}

                {messages.length === 0 && !loading ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div 
                            key={message._id}
                            className={`message ${message.sender === user?._id ? 'sent' : 'received'}`}
                        >
                            <div className="message-content">{message.content}</div>
                            <div className="message-timestamp">
                                {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    ))
                )}

                <div ref={messageEndRef} />
            </div>

            <form className="message-form" onSubmit={handleSendMessage}>
                <textarea
                    value={newMessage}
                    onChange={(e) => {console.log("Textarea value changing:", e.target.value); setNewMessage(e.target.value)}}
                    placeholder="Type your message here..."
                    rows="2"
                    onFocus={(e) => {console.log("Textarea focused:");}}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                />
                <button type="submit" disabled={!newMessage.trim() || !socket} 
                onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage();}}>Send</button>
            </form>
        </div>
    );
};

export default ChatNow;

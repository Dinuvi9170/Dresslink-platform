import React, {useState, useEffect, useRef} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import './chatNow.css';

const ChatNow = () => {
    const { professionalId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
  
    // Get professional info from navigation state or fetch it
    const professionalName = location.state?.professionalName || 'Professional';
    const professionalImage = location.state?.professionalImage || 'https://avatar.iran.liara.run/public/boy?username=Pro';
    const gigTitle = location.state?.gigTitle || '';
  
    const messageEndRef = useRef(null);

    // Check authentication and get current user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { from: `/chat/${professionalId}` } });
            return;
        }
        
        // parse the JWT token
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Set user from token data
            setUser({
                _id: payload._id,
                email: payload.email,
                fname: payload.fname,
                lname: payload.lname,
                image: payload.image
            });
            
            setError(null);
        } catch (err) {
            console.error("Error parsing authentication token:", err);
            setError("Authentication failed. Please login again.");
            navigate('/login', { state: { from: `/chat/${professionalId}` } });
        }
    }, [professionalId, navigate]);

    // Fetch previous messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) return;
      
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                
                // First, get or create a conversation with the professional
                const conversationResponse = await axios.post(
                    'http://localhost:3000/conversations',
                    { participantId: professionalId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                const conversationId = conversationResponse.data._id;
                
                // Then fetch messages using the conversation ID
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

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
    
        if (!newMessage.trim()) return;
    
        try {
            const token = localStorage.getItem('token');
      
        // Add message optimistically to UI
        const tempMessage = {
            _id: Date.now().toString(),
            sender: user._id,
            content: newMessage,
            createdAt: new Date().toISOString(),
            isTemp: true // Flag to identify temp messages
        };
      
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
      
        // Send message to API
        const response = await axios.post(
            'http://localhost:3000/messages',
            {
                receiverId: professionalId,
                content: newMessage
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
      
        // Replace temp message with actual one from server
        setMessages(prev => 
            prev.filter(msg => !msg.isTemp).concat(response.data)
        );
      
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Failed to send message. Please try again.");
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
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows="2"
                />
                <button type="submit" disabled={!newMessage.trim()}>Send</button>
            </form>
        </div>
    );
}
export default ChatNow;
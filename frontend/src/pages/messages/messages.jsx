import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login', { state: { from: '/messages' } });
          return;
        }

        const response = await axios.get('http://localhost:3000/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setConversations(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError('Failed to load your conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [navigate]);

  // Get the other user from conversation participants
  const getOtherParticipant = (conversation, currentUser) => {
    return conversation.participants.find(p => 
      p._id !== currentUser._id
    ) || {};
  };

  // Format timestamp for last message
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show date with year
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle clicking on a conversation
  const handleConversationClick = (conversation) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Parse the JWT to get current user info
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Find the other participant
    const otherParticipant = getOtherParticipant(conversation, payload);
    
    // Navigate to chat with appropriate parameters
    navigate(`/chatNow/${otherParticipant._id}`, {
      state: {
        professionalName: `${otherParticipant.fname || ''} ${otherParticipant.lname || ''}`.trim() || otherParticipant.username,
        professionalImage: otherParticipant.image || 'https://avatar.iran.liara.run/public/boy',
        conversationId: conversation._id
      }
    });
  };

  if (loading) {
    return <div className="messages-loading">Loading your conversations...</div>;
  }
  
  // Filter conversations to only include those with messages
  const conversationsWithMessages = conversations.filter(conv => conv.lastMessage);

  return (
    <div className="messages-container">
      <h1>Messages</h1>
      
      {error && <div className="messages-error">{error}</div>}
      
      {conversationsWithMessages.length === 0 ? (
        <div className="no-conversations">
          <p>You don't have any active conversations yet.</p>
          <p>Start by contacting a professional or supplier!</p>
        </div>
      ) : (
        <div className="conversation-list">
          {conversationsWithMessages.map(conversation => {
            const token = localStorage.getItem('token');
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const currentUser = JSON.parse(window.atob(base64));
            
            const otherUser = getOtherParticipant(conversation, currentUser);
            const hasUnread = conversation.unreadCount > 0;
            
            return (
                <div 
                    key={conversation._id}
                    className={`conversation-item ${hasUnread ? 'unread' : ''}`}
                    onClick={() => handleConversationClick(conversation)}
                >
                    <div className="conversation-avatar">
                    <img 
                        src={otherUser.image || 'https://avatar.iran.liara.run/public/boy'} 
                        alt={otherUser.username || 'User'} 
                    />
                    {hasUnread && <span className="unread-badge">{conversation.unreadCount}</span>}
                    </div>
                    
                    <div className="conversation-details">
                    <div className="conversation-header">
                        <h3>{`${otherUser.fname || ''} ${otherUser.lname || ''}`.trim() || otherUser.username}</h3>
                        <span className="conversation-time">
                            {formatTimestamp(conversation.lastMessage.createdAt)}
                        </span>
                    </div>
                    
                    <div className="conversation-preview">
                        <p>{conversation.lastMessage.content.length > 50 
                            ? `${conversation.lastMessage.content.substring(0, 50)}...` 
                            : conversation.lastMessage.content}
                        </p>
                    </div>
                    </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Messages;
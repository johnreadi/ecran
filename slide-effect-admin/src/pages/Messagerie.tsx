import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Search, MoreVertical, Phone, Video } from 'lucide-react';
import api from '../api';

interface Conversation {
  user_id: string;
  email: string;
  name: string;
  role: string;
  unread_count: number;
  last_message_at: string;
  last_message: string;
}

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  attachments: any[];
  is_read: number;
  created_at: string;
  from_name: string;
  to_name: string;
}

export default function Messagerie() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.user_id);
      const interval = setInterval(() => loadMessages(selectedUser.user_id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.get(`/messages/conversations?userId=${currentUser.id}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const response = await api.get(`/messages/${userId}?currentUserId=${currentUser.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await api.post('/messages', {
        fromUserId: currentUser.id,
        toUserId: selectedUser.user_id,
        content: newMessage,
      });
      setNewMessage('');
      loadMessages(selectedUser.user_id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Messagerie</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.user_id}
              onClick={() => setSelectedUser(conv)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                selectedUser?.user_id === conv.user_id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                {conv.name?.charAt(0).toUpperCase() || conv.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 truncate">{conv.name || conv.email}</h3>
                  {conv.unread_count > 0 && (
                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conv.last_message_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                {selectedUser.name?.charAt(0).toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name || selectedUser.email}</h3>
                <p className="text-sm text-gray-500">{selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Phone size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Video size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.from_user_id === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez un message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={24} />
            </div>
            <p>Sélectionnez une conversation pour commencer</p>
          </div>
        </div>
      )}
    </div>
  );
}

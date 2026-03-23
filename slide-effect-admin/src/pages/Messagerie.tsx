import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Search, MoreVertical, Phone, Video, Archive, Reply, Trash2, Calendar, X, Download, FileText, Image, File } from 'lucide-react';
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
  parent_id?: string;
  content: string;
  attachments: any[];
  is_read: number;
  is_archived: number;
  calendar_event?: {
    title: string;
    date: string;
    time?: string;
  };
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
  const [showArchived, setShowArchived] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarEvent, setCalendarEvent] = useState({ title: '', date: '', time: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedUser) return;

    try {
      const formData = new FormData();
      formData.append('fromUserId', currentUser.id);
      formData.append('toUserId', selectedUser.user_id);
      formData.append('content', newMessage);
      if (replyTo) {
        formData.append('parentId', replyTo.id);
      }
      if (calendarEvent.title && showCalendarModal) {
        formData.append('calendarEvent', JSON.stringify(calendarEvent));
      }
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewMessage('');
      setReplyTo(null);
      setSelectedFiles([]);
      setCalendarEvent({ title: '', date: '', time: '' });
      setShowCalendarModal(false);
      loadMessages(selectedUser.user_id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const archiveMessage = async (messageId: string, archive: boolean) => {
    try {
      await api.put(`/messages/${messageId}/archive`, {
        userId: currentUser.id,
        archive
      });
      loadMessages(selectedUser!.user_id);
      loadConversations();
    } catch (error) {
      console.error('Error archiving message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await api.delete(`/messages/${messageId}`, { data: { userId: currentUser.id } });
      loadMessages(selectedUser!.user_id);
      loadConversations();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <Image size={16} />;
    if (mimetype.includes('pdf')) return <FileText size={16} />;
    return <File size={16} />;
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
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messagerie</h2>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-xs px-2 py-1 rounded ${showArchived ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {showArchived ? 'Actifs' : 'Archivés'}
            </button>
          </div>
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
            {messages.filter(m => showArchived ? m.is_archived : !m.is_archived).map((msg) => {
              const isMe = msg.from_user_id === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[70%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2 relative`}>
                    {/* Message parent (réponse) */}
                    {msg.parent_id && (
                      <div className={`text-xs mb-2 pb-2 border-b ${isMe ? 'border-indigo-400 text-indigo-200' : 'border-gray-300 text-gray-500'}`}>
                        En réponse à un message
                      </div>
                    )}
                    
                    <p>{msg.content}</p>
                    
                    {/* Pièces jointes */}
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att: any, idx: number) => (
                          <a
                            key={idx}
                            href={`${import.meta.env.VITE_API_URL}${att.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-sm ${isMe ? 'text-indigo-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'} underline`}
                          >
                            {getFileIcon(att.mimetype)}
                            {att.name}
                            <Download size={14} />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {/* Événement calendrier */}
                    {msg.calendar_event && (
                      <div className={`mt-2 p-2 rounded ${isMe ? 'bg-indigo-700' : 'bg-white'} flex items-center gap-2`}>
                        <Calendar size={16} />
                        <div className="text-sm">
                          <div className="font-medium">{msg.calendar_event.title}</div>
                          <div className="text-xs opacity-75">
                            {new Date(msg.calendar_event.date).toLocaleDateString('fr-FR')}
                            {msg.calendar_event.time && ` à ${msg.calendar_event.time}`}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-xs ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      
                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => setReplyTo(msg)}
                          className={`p-1 rounded ${isMe ? 'hover:bg-indigo-700' : 'hover:bg-gray-200'}`}
                          title="Répondre"
                        >
                          <Reply size={14} />
                        </button>
                        <button
                          onClick={() => archiveMessage(msg.id, !msg.is_archived)}
                          className={`p-1 rounded ${isMe ? 'hover:bg-indigo-700' : 'hover:bg-gray-200'}`}
                          title={msg.is_archived ? 'Désarchiver' : 'Archiver'}
                        >
                          <Archive size={14} />
                        </button>
                        {isMe && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className={`p-1 rounded ${isMe ? 'hover:bg-indigo-700' : 'hover:bg-gray-200'}`}
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            {/* Réponse en cours */}
            {replyTo && (
              <div className="mb-2 p-2 bg-gray-100 rounded-lg flex justify-between items-center">
                <span className="text-sm text-gray-600">Réponse à: {replyTo.content.substring(0, 50)}...</span>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            )}
            
            {/* Fichiers sélectionnés */}
            {selectedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                    {file.name}
                    <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Modal calendrier */}
            {showCalendarModal && (
              <div className="mb-2 p-3 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-indigo-900">Ajouter un événement</span>
                  <button onClick={() => setShowCalendarModal(false)} className="text-indigo-400 hover:text-indigo-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Titre de l'événement"
                    value={calendarEvent.title}
                    onChange={(e) => setCalendarEvent({...calendarEvent, title: e.target.value})}
                    className="w-full px-3 py-1.5 border rounded text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={calendarEvent.date}
                      onChange={(e) => setCalendarEvent({...calendarEvent, date: e.target.value})}
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
                    />
                    <input
                      type="time"
                      value={calendarEvent.time}
                      onChange={(e) => setCalendarEvent({...calendarEvent, time: e.target.value})}
                      className="px-3 py-1.5 border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Paperclip size={20} />
              </button>
              <button 
                onClick={() => setShowCalendarModal(!showCalendarModal)}
                className={`p-2 rounded-lg ${showCalendarModal ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <Calendar size={20} />
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
                disabled={!newMessage.trim() && selectedFiles.length === 0}
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

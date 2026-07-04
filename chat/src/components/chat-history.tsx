'use client';

import { useState } from 'react';
import { MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
  metadata?: {
    totalMessages?: number;
  };
}

interface Props {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, newTitle: string) => void;
}

export function ChatHistory({
  chats,
  currentChatId,
  isLoading,
  onSelect,
  onDelete,
  onRename,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (chat: Chat) => {
    setEditingId(chat._id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      onRename(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  if (isLoading) {
    return (
      <div className="p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-2 h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No chats yet
      </div>
    );
  }

  return (
    <div className="p-2">
      {chats.map((chat) => (
        <div
          key={chat._id}
          className={`group relative mb-1 rounded-lg transition-colors ${
            chat._id === currentChatId
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-gray-50'
          }`}
        >
          {editingId === chat._id ? (
            <div className="p-2 flex items-center gap-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(chat._id);
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
                autoFocus
              />
              <button
                onClick={() => handleSaveEdit(chat._id)}
                className="min-h-[40px] min-w-[40px] p-2 hover:bg-green-100 rounded flex items-center justify-center"
                aria-label="Save"
              >
                <Check className="w-5 h-5 text-green-600" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="min-h-[40px] min-w-[40px] p-2 hover:bg-red-100 rounded flex items-center justify-center"
                aria-label="Cancel"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => onSelect(chat._id)}
              className="w-full text-left p-3 flex items-start gap-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors min-h-[56px]"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">
                  {chat.title}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>
                    {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                  </span>
                  {chat.metadata?.totalMessages && (
                    <span className="hidden sm:inline">• {chat.metadata.totalMessages} msgs</span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(chat);
                  }}
                  className="min-h-[32px] min-w-[32px] p-1 hover:bg-gray-200 rounded flex items-center justify-center"
                  aria-label="Edit chat title"
                >
                  <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this chat?')) {
                      onDelete(chat._id);
                    }
                  }}
                  className="min-h-[32px] min-w-[32px] p-1 hover:bg-red-100 rounded flex items-center justify-center"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


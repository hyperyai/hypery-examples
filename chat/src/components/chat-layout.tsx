'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from './chat-interface';
import { ChatHistory } from './chat-history';
import { createClient, fetchChats, createChat } from '@/lib/openai-client';
import { MessageSquarePlus, LogOut, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetClose, SheetTitle } from './ui/sheet';

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
  metadata?: {
    totalMessages?: number;
  };
}

interface Props {
  apiKey: string;
  onLogout: () => void;
}

export function ChatLayout({ apiKey, onLogout }: Props) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const client = createClient(apiKey);

  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      if (!cancelled) {
        await loadChats();
      }
    };
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const loadChats = async () => {
    try {
      setIsLoadingChats(true);
      const data = await fetchChats(apiKey);
      setChats(data.chats || []);
      
      // Auto-select first chat if none selected
      if (!currentChatId && data.chats?.length > 0) {
        setCurrentChatId(data.chats[0]._id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createChat(apiKey, 'New Chat');
      setChats([newChat, ...chats]);
      setCurrentChatId(newChat._id);
      setIsMobileMenuOpen(false); // Close mobile menu after creating chat
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setIsMobileMenuOpen(false); // Close mobile menu when selecting chat
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const { deleteChat } = await import('@/lib/openai-client');
      await deleteChat(apiKey, chatId);
      setChats(chats.filter(c => c._id !== chatId));
      
      if (currentChatId === chatId) {
        setCurrentChatId(chats[0]?._id || null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      const { updateChat } = await import('@/lib/openai-client');
      await updateChat(apiKey, chatId, { title: newTitle });
      setChats(chats.map(c => c._id === chatId ? { ...c, title: newTitle } : c));
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Sidebar content component (reused for mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Hypery</h1>
          <button
            onClick={onLogout}
            className="min-h-[44px] min-w-[44px] p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatHistory
          chats={chats}
          currentChatId={currentChatId}
          isLoading={isLoadingChats}
          onSelect={handleSelectChat}
          onDelete={handleDeleteChat}
          onRename={handleRenameChat}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 min-h-[44px] min-w-[44px] p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Sidebar (Drawer) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
            <SheetClose asChild>
              <button
                className="min-h-[44px] min-w-[44px] p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </SheetClose>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 lg:w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {currentChatId ? (
          <ChatInterface
            client={client}
            apiKey={apiKey}
            chatId={currentChatId}
            onChatUpdate={loadChats}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquarePlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No chat selected
              </h2>
              <p className="text-gray-500">
                Create a new chat or select an existing one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


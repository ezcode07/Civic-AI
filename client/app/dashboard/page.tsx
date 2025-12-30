"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import ChatMessage from "@/components/dashboard/ChatMessage";
import InputBar from "@/components/dashboard/InputBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/axios";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export default function Dashboard() {
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChat]);

  const fetchChats = async () => {
    try {
      const response = await api.get("/api/chats");
      const fetchedChats = response.data.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        messages: [],
        lastUpdated: new Date(chat.updated_at)
      }));
      setChats(fetchedChats);
      
      if (fetchedChats.length > 0 && !activeChat) {
        setActiveChat(fetchedChats[0].id);
      } else if (fetchedChats.length === 0) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await api.get(`/api/chats/${chatId}/messages`);
      const messages = response.data.map((msg: any) => ({
        id: msg.id,
        type: msg.sender,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: messages }
          : chat
      ));
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat);
  };

  const handleSendMessage = async (message: string) => {
    if ((!message.trim() && !selectedImage) || isLoading) return;

    // Optimistic update
    const tempId = Date.now().toString();
    const userContent = selectedImage 
      ? `📷 **Image uploaded:** ${selectedImage.name}${message.trim() ? `\n\n**Question:** ${message}` : ''}`
      : message;

    const newMessage: Message = {
      id: tempId,
      type: "user",
      content: userContent,
      timestamp: new Date()
    };

    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [...chat.messages, newMessage], lastUpdated: new Date() }
        : chat
    ));

    setInputValue("");
    setIsLoading(true);

    try {
      let response;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('language', selectedLanguage.split(" ")[0].toLowerCase());
        if (activeChat) {
          formData.append('chat_id', activeChat);
        }

        response = await api.post("/api/ocr", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await api.post("/api/query", {
          question: message,
          language: selectedLanguage.split(" ")[0].toLowerCase(),
          chat_id: activeChat
        });
      }

      // Refresh messages to get the real IDs and AI response from DB
      if (activeChat) {
        await fetchMessages(activeChat);
        // Also refresh chat list to update timestamps/titles
        fetchChats();
      } else if (response.data.chat_id) {
        // If it was a new chat (no activeChat), set it now
        await fetchChats();
        setActiveChat(response.data.chat_id);
      }

      setSelectedImage(null);

    } catch (error: any) {
      console.error("API Error:", error);
      
      let errorMessage = "I'm sorry, I'm having trouble connecting to the server right now.";
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || "Please check your input.";
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: errorMessage,
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, errorResponse], lastUpdated: new Date() }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
  };

  const handleNewChat = () => {
    setActiveChat(null);
    setSelectedImage(null);
    setInputValue("");
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await api.delete(`/api/chats/${chatId}`);
      
      // Remove chat from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If deleted chat was active, switch to new chat mode
      if (activeChat === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-white">
        {/* Top Navbar */}
        <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Civic-AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            chats={chats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {!activeChat && chats.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center mt-20">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Civic-AI</h2>
                    <p className="text-gray-600 max-w-md">
                      Ask questions about government schemes, legal notices, or upload documents for instant analysis.
                    </p>
                  </div>
                )}

                {getCurrentChat()?.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-3xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Civic-AI is thinking</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Bar */}
            <InputBar
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              onImageUpload={handleImageUpload}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              disabled={isLoading}
              selectedImage={selectedImage}
              onClearImage={handleClearImage}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
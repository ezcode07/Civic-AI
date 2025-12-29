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

  const [activeChat, setActiveChat] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, activeChat]);

  const getCurrentChat = () => {
    return chats.find(chat => chat.id === activeChat);
  };

  const handleSendMessage = async (message: string) => {
    if ((!message.trim() && !selectedImage) || isLoading) return;

    // Create user message
    const userContent = selectedImage 
      ? `📷 **Image uploaded:** ${selectedImage.name}${message.trim() ? `\n\n**Question:** ${message}` : ''}`
      : message;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: userContent,
      timestamp: new Date()
    };

    // Add user message
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
        // Handle image upload with OCR
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('language', selectedLanguage.split(" ")[0].toLowerCase());

        response = await api.post("/api/ocr", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Clear selected image after successful upload
        setSelectedImage(null);
      } else {
        // Handle text query
        response = await api.post("/api/query", {
          question: message,
          language: selectedLanguage.split(" ")[0].toLowerCase()
        });
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: selectedImage 
          ? response.data.ai_explanation || "I couldn't process the image. Please try again."
          : response.data.answer || "I apologize, but I couldn't process your request at the moment. Please try again.",
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, aiResponse], lastUpdated: new Date() }
          : chat
      ));

    } catch (error: any) {
      console.error("API Error:", error);
      
      let errorMessage = "I'm sorry, I'm having trouble connecting to the server right now. Please check your connection and try again.";
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || "Please check your input and try again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
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

      // Clear selected image on error
      setSelectedImage(null);
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
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      lastUpdated: new Date()
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setSelectedImage(null); // Clear any selected image
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
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
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
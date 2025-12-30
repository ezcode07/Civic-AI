"use client";

import { useState, useRef, useEffect } from "react";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onImageUpload: (file: File) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  selectedImage?: File | null;
  onClearImage?: () => void;
}

const languages = [
  "English",
  "हिंदी (Hindi)",
  "বাংলা (Bengali)",
  "తెలుగు (Telugu)",
  "मराठी (Marathi)",
  "தமிழ் (Tamil)",
  "ગુજરાતી (Gujarati)",
  "ಕನ್ನಡ (Kannada)",
  "മലയാളം (Malayalam)",
  "ਪੰਜਾਬੀ (Punjabi)"
];

export default function InputBar({
  value,
  onChange,
  onSend,
  onImageUpload,
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  selectedImage,
  onClearImage
}: InputBarProps) {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((value.trim() || selectedImage) && !disabled) {
      onSend(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, JPEG)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      onImageUpload(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getLanguageShort = (language: string) => {
    const shortNames: { [key: string]: string } = {
      "English": "EN",
      "हिंदी (Hindi)": "HI",
      "বাংলা (Bengali)": "BN",
      "తెలుగు (Telugu)": "TE",
      "मराठी (Marathi)": "MR",
      "தமிழ் (Tamil)": "TA",
      "ગુજરાતી (Gujarati)": "GU",
      "ಕನ್ನಡ (Kannada)": "KN",
      "മലയാളം (Malayalam)": "ML",
      "ਪੰਜਾਬੀ (Punjabi)": "PA"
    };
    return shortNames[language] || "EN";
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">{selectedImage.name}</p>
                  <p className="text-xs text-blue-600">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB • Ready for OCR
                  </p>
                </div>
              </div>
              <button
                onClick={onClearImage}
                disabled={disabled}
                className="text-blue-600 hover:text-blue-800 disabled:text-blue-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end space-x-3">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedImage 
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Main Input Container */}
            <div className="flex-1 relative">
              <div className="bg-gray-50 border border-gray-300 rounded-2xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors duration-200">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  placeholder={
                    disabled 
                      ? "Civic-AI is processing..." 
                      : selectedImage 
                        ? "Add a question about this image (optional)..." 
                        : "Ask about government schemes, legal notices, or upload an image..."
                  }
                  className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-600 disabled:cursor-not-allowed min-h-[48px] max-h-[120px]"
                  rows={1}
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!value.trim() && !selectedImage) || disabled}
                  className="absolute right-2 bottom-2 w-8 h-8 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                disabled={disabled}
                className="flex-shrink-0 w-12 h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              >
                <span className="text-xs font-semibold text-gray-700">
                  {getLanguageShort(selectedLanguage)}
                </span>
              </button>

              {showLanguageDropdown && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                    Select Language
                  </div>
                  {languages.map((language) => (
                    <button
                      key={language}
                      onClick={() => {
                        onLanguageChange(language);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                        selectedLanguage === language ? 'bg-blue-50 text-blue-700' : 'text-gray-800'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Helper Text */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            {selectedImage 
              ? "Press Enter to analyze image • Click X to remove image"
              : "Press Enter to send, Shift+Enter for new line • Click image icon to upload"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
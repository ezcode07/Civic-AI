"use client";

import { useState, useRef, useEffect } from "react";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onVoiceInput: () => void;
  onFileUpload: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
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
  onVoiceInput,
  onFileUpload,
  selectedLanguage,
  onLanguageChange,
  disabled = false
}: InputBarProps) {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end space-x-3">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={onFileUpload}
              disabled={disabled}
              className="flex-shrink-0 w-10 h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Main Input Container */}
            <div className="flex-1 relative">
              <div className="bg-gray-50 border border-gray-300 rounded-2xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors duration-200">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  placeholder={disabled ? "Civic-AI is responding..." : "Ask about government schemes, legal notices, or public services..."}
                  className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-600 disabled:cursor-not-allowed min-h-[48px] max-h-[120px]"
                  rows={1}
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!value.trim() || disabled}
                  className="absolute right-2 bottom-2 w-8 h-8 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={onVoiceInput}
              disabled={disabled}
              className="flex-shrink-0 w-10 h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Language Selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                disabled={disabled}
                className="flex-shrink-0 w-12 h-10 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                        selectedLanguage === language ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
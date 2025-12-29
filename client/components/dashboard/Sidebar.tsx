"use client";

interface Chat {
  id: string;
  title: string;
  messages: any[];
  lastUpdated: Date;
}

interface SidebarProps {
  chats: Chat[];
  activeChat: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
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

const states = [
  "All India",
  "Andhra Pradesh",
  "Bihar",
  "Gujarat",
  "Karnataka",
  "Kerala",
  "Maharashtra",
  "Punjab",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal"
];

export default function Sidebar({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  selectedLanguage,
  onLanguageChange
}: SidebarProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full bg-black text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </span>
        </button>
      </div>

      {/* Recent Queries */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Queries</h3>
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  activeChat === chat.id
                    ? "bg-white shadow-sm border border-gray-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(chat.lastUpdated)}
                    </p>
                  </div>
                  {activeChat === chat.id && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-2"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="border-t border-gray-200 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Language</h3>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-800"
          >
            {languages.map((language) => (
              <option key={language} value={language} className="text-gray-800">
                {language}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">State</h3>
          <select
            defaultValue="All India"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-800"
          >
            {states.map((state) => (
              <option key={state} value={state} className="text-gray-800">
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Logout */}
        <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
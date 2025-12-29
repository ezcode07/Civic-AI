"use client";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Headers
      if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1 key={currentIndex++} className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
            {trimmedLine.substring(2)}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2 key={currentIndex++} className="text-lg font-semibold text-gray-900 mb-2 mt-4">
            {trimmedLine.substring(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3 key={currentIndex++} className="text-base font-semibold text-gray-900 mb-2 mt-3">
            {trimmedLine.substring(4)}
          </h3>
        );
      }
      // Bullet points
      else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
        elements.push(
          <div key={currentIndex++} className="flex items-start mb-1">
            <span className="text-blue-600 mr-2 mt-1">•</span>
            <span className="text-gray-700">{trimmedLine.substring(2)}</span>
          </div>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s(.+)$/);
        if (match) {
          elements.push(
            <div key={currentIndex++} className="flex items-start mb-1">
              <span className="text-gray-600 mr-2 font-medium">{match[1]}.</span>
              <span className="text-gray-700">{match[2]}</span>
            </div>
          );
        }
      }
      // Bold text (simplified)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        elements.push(
          <p key={currentIndex++} className="font-semibold text-gray-900 mb-3">
            {trimmedLine.slice(2, -2)}
          </p>
        );
      }
      // Regular paragraphs
      else if (trimmedLine.length > 0) {
        // Handle inline bold text
        const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/g);
        const formattedParts = parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIndex} className="font-semibold text-gray-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        elements.push(
          <p key={currentIndex++} className="text-gray-700 leading-relaxed mb-3">
            {formattedParts}
          </p>
        );
      }
      // Empty lines for spacing
      else if (index > 0 && index < lines.length - 1) {
        elements.push(<div key={currentIndex++} className="mb-2"></div>);
      }
    });

    return elements;
  };

  if (message.type === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="flex items-end space-x-2 max-w-3xl">
          <div className="bg-black text-white rounded-2xl px-4 py-3 max-w-full">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs text-gray-300 mt-2">{formatTime(message.timestamp)}</p>
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-4 mb-6">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-3xl flex-1">
        <div className="prose prose-sm max-w-none">
          {renderContent(message.content)}
        </div>
        <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
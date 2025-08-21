"use client";

import { useState, useEffect } from "react";

interface FetchStatusProps {
  isLoading: boolean;
  error?: string | null;
  lastFetch?: Date;
  componentName?: string;
}

export default function FetchStatus({ 
  isLoading, 
  error, 
  lastFetch, 
  componentName = "Component" 
}: FetchStatusProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error || isLoading) {
      setVisible(true);
    } else {
      // Hide after successful fetch
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading]);

  if (!visible && !error && !isLoading) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg text-sm max-w-xs ${
      error 
        ? 'bg-red-100 text-red-800 border border-red-200' 
        : isLoading
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : 'bg-green-100 text-green-800 border border-green-200'
    }`}>
      <div className="flex items-center gap-2">
        {isLoading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
        {error && <span className="text-red-600">⚠️</span>}
        {!error && !isLoading && <span className="text-green-600">✅</span>}
        
        <div>
          <div className="font-medium">{componentName}</div>
          <div className="text-xs">
            {error && `Error: ${error}`}
            {isLoading && "Loading..."}
            {!error && !isLoading && lastFetch && `Updated ${lastFetch.toLocaleTimeString()}`}
          </div>
        </div>
        
        {error && (
          <button
            onClick={() => setVisible(false)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

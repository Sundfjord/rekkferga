'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function TestThemePage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Theme Test Page</h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Current Theme State</h2>
            <p><strong>Theme:</strong> {theme}</p>
            <p><strong>Resolved Theme:</strong> {resolvedTheme}</p>
            <p><strong>Mounted:</strong> {mounted ? 'Yes' : 'No'}</p>
          </div>

          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Theme Controls</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                System
              </button>
            </div>
          </div>

          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">CSS Variables Test</h2>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: 'var(--primary, #1976d2)' }}
              >
                <p className="text-white font-semibold">Primary Color</p>
                <p className="text-white text-sm">var(--primary)</p>
              </div>
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: 'var(--secondary, #ff9800)' }}
              >
                <p className="text-white font-semibold">Secondary Color</p>
                <p className="text-white text-sm">var(--secondary)</p>
              </div>
              <div 
                className="p-3 rounded border"
                style={{ 
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderColor: 'var(--border, #e0e0e0)'
                }}
              >
                <p className="font-semibold">Surface</p>
                <p className="text-sm">var(--surface)</p>
              </div>
              <div 
                className="p-3 rounded"
                style={{ backgroundColor: 'var(--background, #ffffff)' }}
              >
                <p className="font-semibold">Background</p>
                <p className="text-sm">var(--background)</p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">HTML Element Classes</h2>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded">
              HTML classes: {typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

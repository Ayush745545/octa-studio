'use client';

import React from 'react';

interface MediaPanelClosedProps {
  onGetContentIdeas: () => void;
  onUploadMedia: (files: FileList) => void;
  mediaCount: number;
}

export function MediaPanelClosed({
  onGetContentIdeas,
  onUploadMedia,
  mediaCount
}: MediaPanelClosedProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadMedia(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#0a0a0c] border-r border-zinc-800 shrink-0">
      <div className="p-4 flex flex-col gap-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <button className="text-zinc-400 hover:text-yellow-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          
          <button 
            onClick={onGetContentIdeas}
            className="border border-zinc-800 rounded-full px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-900/40 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4z" />
            </svg>
            Get Content Ideas
          </button>

          <button className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="border border-zinc-800 rounded-full px-2.5 py-1 text-xs text-zinc-600 flex items-center gap-1">
            unused
            <button className="text-zinc-400 hover:text-zinc-600">×</button>
          </div>
          <button className="text-xs text-zinc-500 hover:text-white font-medium">
            Clear All
          </button>
        </div>
      </div>

      <div 
        className="flex-1 p-4 flex flex-col"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 text-center hover:border-zinc-300 hover:bg-zinc-900/40 transition-colors">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
            <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
            <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
            <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>
          </div>
          <h3 className="font-semibold text-sm text-white mb-1">
            Drop Media Here to Upload
          </h3>
          <p className="text-xs text-zinc-500">
            Then drag media to the Calendar to schedule posts.
          </p>
        </div>
      </div>
    </div>
  );
}

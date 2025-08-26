import React from 'react';

export const LandingPage: React.FC<{ onFilesUpload: (files: FileList) => void; isProcessing: boolean }> = ({ onFilesUpload, isProcessing }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesUpload(e.target.files);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#181a1b] text-white">
      {/* Header / Hero */}
      <header className="py-10 flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-4xl font-extrabold tracking-tight">Poly</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Prompt Pattern Discovery Made Simple</h1>
        <p className="text-lg text-gray-300 mb-8 text-center max-w-xl">
          Just <span className="text-white font-semibold">upload your exported AI chat histories</span> to get started. Poly will instantly extract your most-used prompts, phrases, and reusable templates.
        </p>
        {/* Upload Area */}
        <div
          className="w-full max-w-lg mx-auto bg-[#232526] border-2 border-dashed border-[#444] rounded-2xl flex flex-col items-center justify-center p-10 cursor-pointer hover:border-blue-500 transition"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mb-4 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 0l-3 3m3-3l3 3m6 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2m16 0a2 2 0 00-2-2H6a2 2 0 00-2 2" /></svg>
          <span className="text-lg font-medium text-gray-200">Drag & drop or click to upload files</span>
          <span className="text-sm text-gray-400 mt-2">Supports .md and .txt exports from any AI chat</span>
          {isProcessing && <span className="mt-4 text-blue-400">Processing...</span>}
        </div>
      </header>

      {/* How It Works */}
      <section className="max-w-3xl mx-auto mt-16 mb-10 px-4">
        <h2 className="text-xl font-semibold mb-6 text-center">How Poly Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
          <div className="flex-1 bg-[#232526] rounded-xl p-6 border border-[#444] flex flex-col items-center">
            <span className="text-3xl mb-2">1️⃣</span>
            <span className="font-semibold mb-1">Upload</span>
            <span className="text-gray-400 text-center">Export your chat history from your favorite AI tool and upload it to Poly.</span>
          </div>
          <div className="flex-1 bg-[#232526] rounded-xl p-6 border border-[#444] flex flex-col items-center">
            <span className="text-3xl mb-2">2️⃣</span>
            <span className="font-semibold mb-1">Analyze</span>
            <span className="text-gray-400 text-center">Poly automatically finds your most-used prompts, recurring phrases, and templates.</span>
          </div>
          <div className="flex-1 bg-[#232526] rounded-xl p-6 border border-[#444] flex flex-col items-center">
            <span className="text-3xl mb-2">3️⃣</span>
            <span className="font-semibold mb-1">Copy & Reuse</span>
            <span className="text-gray-400 text-center">Click any pattern to copy it instantly. Build your own prompt library in seconds.</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-gray-500 text-sm border-t border-[#232526]">
        &copy; {new Date().getFullYear()} Poly. Prompt pattern discovery for everyone.
      </footer>
    </div>
  );
};

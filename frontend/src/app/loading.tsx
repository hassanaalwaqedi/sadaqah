"use client";

import Image from "next/image";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="relative w-20 h-20 mb-8 animate-pulse">
        <Image 
          src="/brand/logo.png" 
          alt="Loading Sadaqah" 
          fill 
          className="object-contain drop-shadow-xl" 
        />
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}

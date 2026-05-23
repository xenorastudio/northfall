import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openGlobalImageModal(url: string, title?: string) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[999999] bg-black/95 flex flex-col items-center justify-center cursor-zoom-out animate-in fade-in duration-200';
  overlay.onclick = () => overlay.remove();

  const topBar = document.createElement('div');
  topBar.className = 'absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center px-6 justify-between z-10 pointer-events-none';
  
  const titleEl = document.createElement('span');
  titleEl.className = 'text-white/90 text-sm font-medium drop-shadow-md';
  titleEl.innerText = title || '';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center pointer-events-auto';
  closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeBtn.onclick = (e) => { e.stopPropagation(); overlay.remove(); };

  topBar.appendChild(titleEl);
  topBar.appendChild(closeBtn);

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'relative w-full h-full flex items-center justify-center p-4 sm:p-10';
  
  const img = document.createElement('img');
  img.src = url;
  img.className = 'max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-200 cursor-default';
  img.onclick = (e) => e.stopPropagation();

  imgWrapper.appendChild(img);
  overlay.appendChild(topBar);
  overlay.appendChild(imgWrapper);
  document.body.appendChild(overlay);
}

import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { ScanLine } from 'lucide-react';
import { DrugSearch } from './DrugSearch';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden min-h-dvh bg-[var(--bg)]">
      {/* Background gradient layer - behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-radial" />
      
      {/* App frame container */}
      <div className="relative z-10 mx-auto max-w-[430px] min-h-dvh flex flex-col">
        {/* Header - sticky, above content */}
        <header className="sticky top-0 z-30 bg-[var(--surface)]/80 backdrop-blur-lg border-b border-[var(--stroke)] overflow-visible">
          <div className="px-[18px] py-3">
            <div className="relative">
              <DrugSearch />
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted2)] hover:text-[var(--text)] transition-colors z-10"
                aria-label="Scan barcode"
              >
                <ScanLine size={18} />
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content - scrollable, above background */}
        <main className="relative z-10 flex-1 px-[18px] py-4 pb-24 overflow-y-auto min-h-0">
          <div className="relative z-10">
            {children}
          </div>
        </main>
        
        {/* Bottom navigation - fixed, above everything */}
        <BottomNav />
      </div>
    </div>
  );
}




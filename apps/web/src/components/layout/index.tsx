import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { MobileBottomNav } from './mobile-nav';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function Layout() {
  // Initialize global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans antialiased dark">
      <Header />
      <main className="flex-1 container py-4 md:py-6 lg:py-8 px-4 md:px-6 relative pb-20 md:pb-6">
        <Outlet />
      </main>
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}

export { Header } from './header';
export { MobileBottomNav } from './mobile-nav';

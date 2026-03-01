import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <Header />

        {/* Content */}
        <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}

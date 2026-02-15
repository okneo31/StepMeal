import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-16 max-w-lg mx-auto">
      {children}
      <BottomNav />
    </div>
  );
}

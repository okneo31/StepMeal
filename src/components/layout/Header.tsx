"use client";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => window.history.back()} className="p-1 -ml-1 text-gray-600">
              ←
            </button>
          )}
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}

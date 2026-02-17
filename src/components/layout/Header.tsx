"use client";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, rightAction }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)]">
      <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => window.history.back()} className="p-1 -ml-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          )}
          <h1 className="text-lg font-bold text-[var(--color-text)]">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}

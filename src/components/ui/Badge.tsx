interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "amber" | "blue" | "gray" | "red" | "purple";
  size?: "sm" | "md";
}

export default function Badge({ children, variant = "green", size = "sm" }: BadgeProps) {
  const colors = {
    green: "bg-green-500/15 text-green-400 border border-green-500/20",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    blue: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    gray: "bg-gray-500/15 text-gray-400 border border-gray-500/20",
    red: "bg-red-500/15 text-red-400 border border-red-500/20",
    purple: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${colors[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

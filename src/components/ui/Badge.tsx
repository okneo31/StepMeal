interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "amber" | "blue" | "gray" | "red";
  size?: "sm" | "md";
}

export default function Badge({ children, variant = "green", size = "sm" }: BadgeProps) {
  const colors = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
  };
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colors[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

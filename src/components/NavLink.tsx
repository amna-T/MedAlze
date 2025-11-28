import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const NavLink = ({ to, icon: Icon, label }: CustomNavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

NavLink.displayName = "NavLink";

export { NavLink };

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Network, 
  Database, 
  BarChart3, 
  Settings,
  Rocket,
  FileText,
  Brain
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Search", icon: Search },
  { path: "/search", label: "Results", icon: FileText },
  { path: "/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { path: "/datasets", label: "Datasets", icon: Database },
  { path: "/compare", label: "Compare", icon: BarChart3 },
  { path: "/admin", label: "Admin", icon: Settings },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 text-xl font-bold">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-cosmic">
              <Brain className="w-6 h-6 text-sky-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-cosmic">SpaceBio Engine Sirius</span>
              <span className="text-xs text-muted-foreground font-normal">Knowledge Engine</span>
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === "/search" && location.pathname.startsWith("/paper/"));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-gradient-stellar text-sky-white shadow-cosmic" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-full text-xs">
              <Rocket className="w-3 h-3 text-nasa-orange" />
              <span className="text-muted-foreground">Mission Control</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
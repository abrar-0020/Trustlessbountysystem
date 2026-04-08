import {
  LayoutDashboard,
  Plus,
  List,
  FileText,
  AlertCircle,
  Menu,
  X,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Create Bounty", href: "/app/create", icon: Plus },
  { name: "My Bounties", href: "/app/bounties", icon: List },
  { name: "Submissions", href: "/app/bounties", icon: FileText },
  { name: "Disputes", href: "/app/disputes", icon: AlertCircle },
];

const bottomNav = [
  { name: "Settings", href: "#", icon: Settings },
  { name: "Help", href: "#", icon: HelpCircle },
];

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      {/* Main navigation */}
      <div className="flex-1 px-3 space-y-0.5">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                active
                  ? "bg-[#EFF6FF] text-[#2563EB]"
                  : "text-[#4B4B4B] hover:bg-[#F5F5F5] hover:text-[#1F1F1F]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#2563EB]" : "text-[#CFCFCF]"}`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom navigation */}
      <div className="px-3 space-y-0.5 border-t border-[#E5E5E5] pt-3 mt-3">
        {bottomNav.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#4B4B4B] hover:bg-[#F5F5F5] hover:text-[#1F1F1F] transition-all duration-150"
          >
            <item.icon className="w-4 h-4 flex-shrink-0 text-[#CFCFCF]" />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3.5 right-4 z-50 p-2 bg-white border border-[#E5E5E5] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-4 h-4 text-[#1F1F1F]" />
        ) : (
          <Menu className="w-4 h-4 text-[#1F1F1F]" />
        )}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-60 bg-white border-r border-[#E5E5E5] z-40 transform transition-transform duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.08)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-14">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-white border-r border-[#E5E5E5] min-h-full">
        <SidebarContent />
      </aside>
    </>
  );
}

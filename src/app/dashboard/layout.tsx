import Link from "next/link";
import { FileText, Receipt, LayoutDashboard, Settings } from "lucide-react";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/devis", label: "Devis", icon: FileText },
  { href: "/dashboard/factures", label: "Factures", icon: Receipt },
  { href: "/dashboard/settings", label: "Mon entreprise", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fafbff] via-white to-indigo-50/30 dark:from-[#0a0a14] dark:via-[#0f0f1a] dark:to-[#0a0a20] transition-colors duration-300">
      {/* Top navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 dark:bg-[#0a0a14]/85 backdrop-blur-lg border-b border-gray-200/50 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-2 h-14">
            <Link href="/dashboard" className="flex items-center gap-2 mr-3 sm:mr-6">
              <span className="text-lg font-bold gradient-text hidden sm:inline">MonDevis</span>
            </Link>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-300 hover:-translate-y-1 active:scale-90"
              >
                <item.icon className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
            <div className="ml-auto flex items-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

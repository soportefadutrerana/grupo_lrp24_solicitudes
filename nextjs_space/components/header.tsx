"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, FileText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function Header() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();

  if (!session) return null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b-2 border-[#D4AF37]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/dashboard" className="flex items-center space-x-4 group">
            <div>
              <h1 className="text-2xl font-bold text-[#D4AF37] font-serif tracking-wider">
                GRUPO LRP 24
              </h1>
              <p className="text-xs text-gray-400 font-serif">Sistema de Solicitudes</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                size="sm"
                className="font-serif"
              >
                <FileText className="mr-2 h-4 w-4" />
                Nueva Solicitud
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant={pathname === "/admin" ? "default" : "ghost"}
                size="sm"
                className="font-serif"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Panel Admin
              </Button>
            </Link>
            <div className="flex items-center space-x-3 border-l-2 border-[#D4AF37]/30 pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-[#D4AF37] font-serif">
                  {session?.user?.name || "Usuario"}
                </p>
                <p className="text-xs text-gray-400 font-serif">
                  {session?.user?.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

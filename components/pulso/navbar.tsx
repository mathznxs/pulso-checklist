"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardCheck,
  Calendar,
  Trophy,
  Settings,
  LogOut,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile, Cargo } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, minCargo: "assistente" as Cargo },
  { label: "Execucao", href: "/execucao", icon: ClipboardCheck, minCargo: "assistente" as Cargo },
  { label: "Calendario", href: "/calendario", icon: Calendar, minCargo: "assistente" as Cargo },
  { label: "Gincanas", href: "/gincanas", icon: Trophy, minCargo: "assistente" as Cargo },
  { label: "Escala", href: "/escala", icon: CalendarClock, minCargo: "assistente" as Cargo },
  { label: "Admin", href: "/admin", icon: Settings, minCargo: "supervisão" as Cargo },
]

const cargoOrder: Record<Cargo, number> = {
  assistente: 0,
  supervisão: 1,
  gerente: 2,
  admin: 3,
  embaixador: 0,
}

const cargoLabels: Record<Cargo, string> = {
  assistente: "Assistente",
  supervisão: "Supervisao",
  gerente: "Gerente",
  admin: "Administrador",
  embaixador: "",
}

interface NavbarProps {
  profile: Profile | null
}

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const userCargo = profile?.cargo ?? "assistente"
  const userLevel = cargoOrder[userCargo]

  const visibleNav = navItems.filter(
    (item) => cargoOrder[item.minCargo] <= userLevel
  )

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary md:h-9 md:w-9">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 md:h-5 md:w-5"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground md:text-lg">
              <span className="text-primary">PULSO</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">
                {profile?.nome ?? "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground">
                {cargoLabels[userCargo]}
              </p>
            </div>
            {/* Mobile: show first name */}
            <p className="text-sm font-semibold text-foreground sm:hidden">
              {profile?.nome?.split(" ")[0] ?? "Usuario"}
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

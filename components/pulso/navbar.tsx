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
  { label: "Admin", href: "/admin", icon: Settings, minCargo: "lideranca" as Cargo },
]

const cargoOrder: Record<Cargo, number> = {
  assistente: 0,
  lideranca: 1,
  gerente: 2,
  admin: 3,
}

const cargoLabels: Record<Cargo, string> = {
  assistente: "Assistente",
  lideranca: "Lideranca",
  gerente: "Gerente",
  admin: "Administrador",
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            CENTAURO{" "}
            <span className="text-primary">PULSO</span>
          </span>
        </Link>

        {/* Navigation */}
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

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1 md:hidden">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

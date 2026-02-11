"use client"

import { Megaphone } from "lucide-react"

interface AnnouncementBannerProps {
  message: string
  onEdit?: () => void
}

export function AnnouncementBanner({ message, onEdit }: AnnouncementBannerProps) {
  return (
    <div className="flex items-center justify-between bg-foreground px-4 py-2 lg:px-6">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-card">
          {message}
        </span>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-card"
        >
          Editar
        </button>
      )}
    </div>
  )
}

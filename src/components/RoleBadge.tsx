"use client"

import { cn } from "@/lib/utils"

type Role = "advertiser" | "influencer" | "admin"

interface RoleBadgeProps {
  role: Role
  className?: string
}

const roleLabels: Record<Role, string> = {
  advertiser: "광고주 모드",
  influencer: "인플루언서 모드",
  admin: "운영자",
}

const roleColors: Record<Role, string> = {
  advertiser: "bg-advertiser text-advertiser-foreground",
  influencer: "bg-influencer text-influencer-foreground",
  admin: "bg-admin text-admin-foreground",
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1",
        "text-xs font-semibold whitespace-nowrap",
        roleColors[role],
        className
      )}
    >
      {roleLabels[role]}
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/RoleBadge"
import { cn } from "@/lib/utils"
import { getFirebaseAuth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

type Role = "advertiser" | "influencer" | "admin"

interface TopNavProps {
  role: Role
  userEmail?: string
  userName?: string
}

interface NavItem {
  label: string
  href: string
}

const navItems: Record<Role, NavItem[]> = {
  advertiser: [
    { label: "대시보드", href: "/advertiser/dashboard" },
    { label: "새 캠페인", href: "/advertiser/campaigns/new" },
  ],
  influencer: [
    { label: "캠페인 탐색", href: "/influencer/feed" },
    { label: "내 지원현황", href: "/influencer/applications" },
  ],
  admin: [
    { label: "대시보드", href: "/admin/dashboard" },
    { label: "캠페인 관리", href: "/admin/campaigns" },
    { label: "계약 현황", href: "/admin/contracts" },
  ],
}

const primaryCTA: Record<Role, { label: string; icon: string; href: string } | null> = {
  advertiser: { label: "새 캠페인 만들기", icon: "+", href: "/advertiser/campaigns/new" },
  influencer: { label: "캠페인 탐색", icon: "🔍", href: "/influencer/feed" },
  admin: null,
}

const roleColors: Record<Role, string> = {
  advertiser: "hover:bg-advertiser/10 data-[active=true]:bg-advertiser/10 data-[active=true]:text-advertiser",
  influencer: "hover:bg-influencer/10 data-[active=true]:bg-influencer/10 data-[active=true]:text-influencer",
  admin: "hover:bg-admin/10 data-[active=true]:bg-admin/10 data-[active=true]:text-admin",
}

const ctaColors: Record<Role, string> = {
  advertiser: "bg-advertiser hover:bg-advertiser/90 text-advertiser-foreground",
  influencer: "bg-influencer hover:bg-influencer/90 text-influencer-foreground",
  admin: "bg-admin hover:bg-admin/90 text-admin-foreground",
}

export function TopNav({ role, userEmail, userName }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const cta = primaryCTA[role]
  const items = navItems[role]

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth()
      await signOut(auth)
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getInitial = () => {
    if (userName) return userName[0].toUpperCase()
    if (userEmail) return userEmail[0].toUpperCase()
    return "U"
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href={items[0].href}
            className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            ADS Platform
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    roleColors[role]
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Role Badge */}
          <RoleBadge role={role} />

          {/* Primary CTA */}
          {cta && (
            <Button asChild className={cn("hidden md:flex gap-2", ctaColors[role])}>
              <Link href={cta.href}>
                <span className="text-base">{cta.icon}</span>
                {cta.label}
              </Link>
            </Button>
          )}

          {/* User Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors font-medium text-sm"
            >
              {getInitial()}
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-56 rounded-md border bg-popover p-1 shadow-md">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{userName || "사용자"}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent rounded-sm transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  roleColors[role]
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

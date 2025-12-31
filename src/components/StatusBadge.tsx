"use client"

import { cn } from "@/lib/utils"

// Campaign statuses (광고주)
type CampaignStatus = "recruiting" | "inProgress" | "completed" | "pending"

// Application statuses (인플루언서)
type ApplicationStatus = "applied" | "underReview" | "selected" | "inProgress" | "completed"

// Contract statuses (운영자)
type ContractStatus = "pending" | "delayed" | "agreed"

type Status = CampaignStatus | ApplicationStatus | ContractStatus

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusLabels: Record<Status, string> = {
  // Campaign statuses
  recruiting: "모집중",
  inProgress: "진행중",
  completed: "완료",
  pending: "검수대기",

  // Application statuses
  applied: "지원함",
  underReview: "검토중",
  selected: "선정",

  // Contract statuses
  delayed: "지연",
  agreed: "완료",
}

const statusColors: Record<Status, string> = {
  recruiting: "bg-status-recruiting/10 text-status-recruiting border-status-recruiting/20",
  inProgress: "bg-status-inProgress/10 text-status-inProgress border-status-inProgress/20",
  completed: "bg-status-completed/10 text-status-completed border-status-completed/20",
  pending: "bg-status-pending/10 text-status-pending border-status-pending/20",
  applied: "bg-status-applied/10 text-status-applied border-status-applied/20",
  underReview: "bg-status-underReview/10 text-status-underReview border-status-underReview/20",
  selected: "bg-status-selected/10 text-status-selected border-status-selected/20",
  delayed: "bg-status-delayed/10 text-status-delayed border-status-delayed/20",
  agreed: "bg-status-selected/10 text-status-selected border-status-selected/20",
}

const statusIcons: Partial<Record<Status, string>> = {
  pending: "⚠️",
  delayed: "🔴",
  agreed: "✓",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const icon = statusIcons[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1",
        "text-xs font-semibold whitespace-nowrap",
        statusColors[status],
        className
      )}
    >
      {icon && <span>{icon}</span>}
      {statusLabels[status]}
    </div>
  )
}

import type { Status } from "@prisma/client"

const CONFIG: Record<Status, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not started", color: "var(--text-muted)" },
  IN_PROGRESS: { label: "In progress", color: "var(--accent)" },
  DONE: { label: "Done", color: "var(--green)" },
  MISSED: { label: "Missed", color: "var(--red)" },
  DEFERRED: { label: "Deferred", color: "var(--yellow)" },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, color } = CONFIG[status]
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 500,
        color,
        border: `1px solid ${color}`,
        borderRadius: "4px",
        padding: "1px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  )
}

"use client"

import { useCallback, useState } from "react"
import { SyncTerminalUI } from "./sync-terminal-ui"
import {
  type SyncEvent,
  type SyncStatus,
  useSyncTerminal,
} from "./use-sync-terminal"

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { SyncTerminalUI, type SyncTerminalUIProps } from "./sync-terminal-ui"
export {
  type SyncEvent,
  type SyncEventLevel,
  type SyncStatus,
  type UseSyncTerminalOptions,
  type UseSyncTerminalReturn,
  useSyncTerminal,
} from "./use-sync-terminal"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props for the composed SyncTerminal block */
export interface SyncTerminalProps {
  /** Events to display in the terminal */
  events: SyncEvent[]
  /** Optional sync status shown in the header */
  status?: SyncStatus
  /** Maximum number of events to retain in the buffer (default: 200) */
  maxEvents?: number
  /** Header title (default: "Sync Log") */
  title?: string
  /** Show timestamps in each line (default: true) */
  showTimestamps?: boolean
  /** Show source labels in each line (default: true) */
  showSource?: boolean
  /** Whether to auto-scroll to the latest event (default: true) */
  autoScroll?: boolean
  /** Whether the terminal starts collapsed (default: false) */
  defaultCollapsed?: boolean
  /** Optional CSS class name */
  className?: string
}

// ---------------------------------------------------------------------------
// Composed component
// ---------------------------------------------------------------------------

/**
 * Collapsible monospace event log for blockchain sync activity with
 * colour-coded severity levels. Click the header to expand/collapse.
 *
 * Composes the `useSyncTerminal` hook with the `SyncTerminalUI`
 * presentation component.
 *
 * @example
 * ```tsx
 * import { SyncTerminal } from "@/components/blocks/sync-terminal"
 *
 * function Dashboard() {
 *   const [events, setEvents] = useState<SyncEvent[]>([])
 *
 *   return (
 *     <SyncTerminal
 *       events={events}
 *       status={{ blockHeight: 850123, connected: true }}
 *       defaultCollapsed={true}
 *     />
 *   )
 * }
 * ```
 */
export function SyncTerminal({
  events,
  status,
  maxEvents = 200,
  title = "Sync Log",
  showTimestamps = true,
  showSource = true,
  autoScroll = true,
  defaultCollapsed = false,
  className,
}: SyncTerminalProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const { events: buffered, bottomRef } = useSyncTerminal({
    events,
    maxEvents,
    autoScroll,
  })

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return (
    <SyncTerminalUI
      events={buffered}
      status={status}
      title={title}
      showTimestamps={showTimestamps}
      showSource={showSource}
      collapsed={collapsed}
      onToggleCollapse={toggleCollapse}
      bottomRef={bottomRef}
      className={className}
    />
  )
}

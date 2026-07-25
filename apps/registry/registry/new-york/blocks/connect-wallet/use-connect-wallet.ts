import { useWallet } from "@1sat/react"
import { useCallback, useMemo, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseConnectWalletReturn {
  /** Current wallet connection status */
  status: string
  /** Identity key when connected */
  identityKey: string | null | undefined
  /** Whether the provider selection dialog is open */
  dialogOpen: boolean
  /** Set the dialog open state */
  setDialogOpen: (open: boolean) => void
  /** Whether the variant is compact */
  isCompact: boolean
  /** Deterministic gradient CSS string for the identity key */
  gradient: string
  /** Truncated identity key for display */
  truncatedKey: string
  /** Initiate a wallet connection */
  handleConnect: () => Promise<void>
  /** Disconnect the wallet */
  handleDisconnect: () => void
  /** Handle trigger button click */
  handleTriggerClick: () => void
  /** Copy identity key to clipboard */
  handleCopy: () => void
  /** Whether the identity key was recently copied */
  copied: boolean
  /** Error from the wallet provider */
  error: Error | null
}

export interface UseConnectWalletOptions {
  /** Button variant */
  variant?: "default" | "compact" | "outline" | null
  /** Called after successful wallet connection */
  onConnect?: () => void
  /** Called after wallet disconnection */
  onDisconnect?: () => void
  /** Called when a connection error occurs */
  onError?: (error: Error) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Deterministic gradient from an address string.
 * Generates two hue values by hashing the address to create a unique gradient.
 */
function addressGradient(address: string): string {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = Math.abs(hash) % 360
  const hue2 = (hue1 + 40 + (Math.abs(hash >> 8) % 80)) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`
}

/** Truncate a key/address for display: "abc123...xyz9" */
function truncate(value: string, startLen = 6, endLen = 4): string {
  if (value.length <= startLen + endLen + 3) return value
  return `${value.slice(0, startLen)}...${value.slice(-endLen)}`
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useConnectWallet({
  variant = "default",
  onConnect,
  onDisconnect,
  onError,
}: UseConnectWalletOptions = {}): UseConnectWalletReturn {
  const { status, identityKey, connect, disconnect, error } = useWallet()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const isCompact = variant === "compact"

  const handleConnect = useCallback(async () => {
    try {
      await connect()
      onConnect?.()
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      onError?.(err)
    }
  }, [connect, onConnect, onError])

  const handleDisconnect = useCallback(() => {
    disconnect()
    onDisconnect?.()
  }, [disconnect, onDisconnect])

  const handleTriggerClick = useCallback(() => {
    void handleConnect()
  }, [handleConnect])

  const handleCopy = useCallback(() => {
    if (!identityKey || typeof window === "undefined") return
    void navigator.clipboard
      .writeText(identityKey)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err: Error) => {
        onError?.(err)
      })
  }, [identityKey, onError])

  const gradient = useMemo(
    () => (identityKey ? addressGradient(identityKey) : ""),
    [identityKey],
  )

  const truncatedKey = useMemo(
    () => (identityKey ? truncate(identityKey) : ""),
    [identityKey],
  )

  return {
    status,
    identityKey,
    dialogOpen,
    setDialogOpen,
    isCompact,
    gradient,
    truncatedKey,
    handleConnect,
    handleDisconnect,
    handleTriggerClick,
    handleCopy,
    copied,
    error,
  }
}

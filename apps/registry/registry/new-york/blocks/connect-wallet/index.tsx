"use client"

import type { VariantProps } from "class-variance-authority"
import {
  ConnectWalletUI,
  type connectWalletVariants,
} from "./ui"
import {
  useConnectWallet,
} from "./use-connect-wallet"

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export {
  ConnectWalletUI,
  type ConnectWalletUIProps,
  connectWalletVariants,
} from "./ui"
export {
  type UseConnectWalletOptions,
  type UseConnectWalletReturn,
  useConnectWallet,
} from "./use-connect-wallet"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectWalletProps
  extends VariantProps<typeof connectWalletVariants> {
  /** Additional CSS classes */
  className?: string
  /** Label shown on the connect button (default: "Connect Wallet") */
  connectLabel?: string
  /** Called after successful wallet connection */
  onConnect?: () => void
  /** Called after wallet disconnection */
  onDisconnect?: () => void
  /** Called when a connection error occurs */
  onError?: (error: Error) => void
}

// ---------------------------------------------------------------------------
// Composed component
// ---------------------------------------------------------------------------

/**
 * A themed wallet connection button wrapping `@1sat/react` primitives.
 *
 * Must be rendered inside both `WalletProvider` and `ConnectDialogProvider`
 * from `@1sat/react`.
 *
 * @example
 * ```tsx
 * import { WalletProvider, ConnectDialogProvider } from "@1sat/react"
 * import { ConnectWallet } from "@/components/blocks/connect-wallet"
 *
 * function App() {
 *   return (
 *     <WalletProvider>
 *       <ConnectDialogProvider>
 *         <ConnectWallet />
 *       </ConnectDialogProvider>
 *     </WalletProvider>
 *   )
 * }
 * ```
 */
export function ConnectWallet({
  variant = "default",
  className,
  connectLabel = "Connect Wallet",
  onConnect,
  onDisconnect,
  onError,
}: ConnectWalletProps) {
  const hook = useConnectWallet({ variant, onConnect, onDisconnect, onError })

  return (
    <ConnectWalletUI
      variant={variant}
      className={className}
      connectLabel={connectLabel}
      status={hook.status}
      identityKey={hook.identityKey ?? undefined}
      dialogOpen={hook.dialogOpen}
      setDialogOpen={hook.setDialogOpen}
      gradient={hook.gradient}
      truncatedKey={hook.truncatedKey}
      onTriggerClick={hook.handleTriggerClick}
      onDisconnect={hook.handleDisconnect}
      onCopy={hook.handleCopy}
      copied={hook.copied}
      error={hook.error}
    />
  )
}

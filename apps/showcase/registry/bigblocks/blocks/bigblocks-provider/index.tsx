"use client"

import { useMemo } from "react"
import {
  BigBlocksContext,
  type BigBlocksContextValue,
  DEFAULT_API_URL,
  DEFAULT_ORDFS_URL,
  type GetBalanceFn,
  type GetHistoryFn,
  type GetOrdinalsFn,
  type GetTokenBalancesFn,
  type ImageLoaderFn,
  type OnExternalLinkFn,
} from "./bigblocks-context"

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------


export type {
  BigBlocksBalance,
  BigBlocksContextValue,
  BigBlocksHistoryEntry,
  BigBlocksOrdinal,
  BigBlocksTokenBalance,
  GetBalanceFn,
  GetHistoryFn,
  GetOrdinalsFn,
  GetTokenBalancesFn,
  ImageLoaderFn,
  OnExternalLinkFn,
} from "./bigblocks-context"
export {
  BigBlocksContext,
  DEFAULT_API_URL,
  DEFAULT_ORDFS_URL,
  useBigBlocks,
} from "./bigblocks-context"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the BigBlocksProvider component */
export interface BigBlocksProviderProps {
  /** 1sat-stack API base URL for web mode (default: "https://api.1sat.app/1sat") */
  apiUrl?: string
  /** ORDFS base URL for on-chain image resolution (default: "https://ordfs.network") */
  ordfsUrl?: string
  /**
   * Custom balance fetcher. When provided, hooks call this function
   * instead of the 1sat-stack API. Useful for desktop RPC, testing, or SSR.
   */
  getBalance?: GetBalanceFn
  /**
   * Custom ordinals fetcher. When provided, hooks call this function
   * instead of the 1sat-stack API.
   */
  getOrdinals?: GetOrdinalsFn
  /**
   * Custom token balance fetcher. When provided, hooks call this function
   * instead of the 1sat-stack API.
   */
  getTokenBalances?: GetTokenBalancesFn
  /**
   * Custom transaction history fetcher. When provided, hooks call this
   * function instead of the 1sat-stack API.
   */
  getHistory?: GetHistoryFn
  /**
   * External link handler for desktop apps. When provided, components use
   * this instead of `window.open` for outbound links.
   */
  onExternalLink?: OnExternalLinkFn
  /**
   * Image optimizer for on-chain ORDFS content. When provided, `OrdfsImage`
   * and every block that renders inscriptions route through it instead of
   * loading the full-size original.
   */
  imageLoader?: ImageLoaderFn
  /** Child components that can access the BigBlocks context */
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Configures how all BigBlocks hooks fetch data.
 *
 * **Web mode** (default): hooks fetch from the 1sat-stack API at the
 * configured `apiUrl`.
 *
 * **Custom mode**: pass one or more custom fetcher functions (`getBalance`,
 * `getOrdinals`, `getTokenBalances`, `getHistory`) and hooks will call those
 * instead of the API. This enables desktop RPC backends, testing stubs, and
 * server-side rendering.
 *
 * @example
 * ```tsx
 * // Web mode — hooks fetch from the 1sat-stack API
 * <BigBlocksProvider>
 *   <App />
 * </BigBlocksProvider>
 *
 * // Custom mode — hooks call your functions instead
 * <BigBlocksProvider
 *   getBalance={myRpcBalance}
 *   getOrdinals={myRpcOrdinals}
 *   onExternalLink={(url) => shell.openExternal(url)}
 * >
 *   <App />
 * </BigBlocksProvider>
 * ```
 */
export function BigBlocksProvider({
  apiUrl = DEFAULT_API_URL,
  ordfsUrl = DEFAULT_ORDFS_URL,
  getBalance,
  getOrdinals,
  getTokenBalances,
  getHistory,
  onExternalLink,
  imageLoader,
  children,
}: BigBlocksProviderProps) {
  const value = useMemo<BigBlocksContextValue>(
    () => ({
      apiUrl,
      ordfsUrl,
      getBalance,
      getOrdinals,
      getTokenBalances,
      getHistory,
      onExternalLink,
      imageLoader,
    }),
    [
      apiUrl,
      ordfsUrl,
      getBalance,
      getOrdinals,
      getTokenBalances,
      getHistory,
      onExternalLink,
      imageLoader,
    ]
  )

  return (
    <BigBlocksContext.Provider value={value}>
      {children}
    </BigBlocksContext.Provider>
  )
}

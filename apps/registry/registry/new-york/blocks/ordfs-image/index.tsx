"use client"

import { useContext } from "react"
import { BigBlocksContext } from "@/registry/new-york/blocks/bigblocks-provider"
import {
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_IMAGE_WIDTHS,
  type OrdfsImageLoader,
} from "./loaders"

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { OrdfsImageLoader, OrdfsImageLoaderArgs } from "./loaders"
export {
  createCloudflareImageLoader,
  createOrdfsThumbLoader,
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_IMAGE_WIDTHS,
  vercelImageLoader,
} from "./loaders"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrdfsImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "src" | "srcSet" | "loading"
  > {
  /** Absolute URL of the original ORDFS content */
  src: string
  /** Alternative text. Required — inscriptions are content, not decoration. */
  alt: string
  /** Responsive size hint, e.g. "(min-width: 1280px) 25vw, 50vw" */
  sizes?: string
  /** Quality hint passed to the loader, 1-100 */
  quality?: number
  /** Widths to generate in `srcSet` */
  widths?: number[]
  /** Native lazy-loading behaviour */
  loading?: "lazy" | "eager"
  /** Loader override for this image, taking precedence over the provider */
  loader?: OrdfsImageLoader
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * An `<img>` for on-chain ORDFS content that routes through whatever image
 * optimizer the host provides.
 *
 * Without a loader configured this renders the original inscription unchanged,
 * so it is safe to use everywhere. Configure `imageLoader` on
 * `BigBlocksProvider` to opt an entire app into optimization at once.
 *
 * @example
 * ```tsx
 * <BigBlocksProvider imageLoader={vercelImageLoader}>
 *   <OrdfsImage
 *     src="https://ordfs.network/content/abc_0"
 *     alt="Ordinal #1"
 *     sizes="(min-width: 768px) 25vw, 50vw"
 *   />
 * </BigBlocksProvider>
 * ```
 */
export function OrdfsImage({
  src,
  alt,
  sizes,
  quality = DEFAULT_IMAGE_QUALITY,
  widths = DEFAULT_IMAGE_WIDTHS,
  loading = "lazy",
  loader,
  onLoad,
  ...imgProps
}: OrdfsImageProps) {
  // Read the context directly rather than through useBigBlocks(), which throws
  // outside a provider — these blocks are usable standalone.
  const context = useContext(BigBlocksContext)
  const resolved = loader ?? context?.imageLoader

  // With no optimizer configured every srcSet entry would be the same URL, so
  // emit a bare src instead of misleading the browser into picking between them.
  const srcSet = resolved
    ? widths.map((w) => `${resolved({ src, width: w, quality })} ${w}w`).join(", ")
    : undefined

  const displaySrc = resolved
    ? resolved({ src, width: widths[widths.length - 1] ?? 1920, quality })
    : src

  return (
    <img
      // A cached image can finish loading before React attaches onLoad, which
      // would strand any skeleton the caller is showing. Catch that on mount.
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0) {
          onLoad?.({ currentTarget: node } as React.SyntheticEvent<HTMLImageElement>)
        }
      }}
      src={displaySrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={onLoad}
      {...imgProps}
    />
  )
}

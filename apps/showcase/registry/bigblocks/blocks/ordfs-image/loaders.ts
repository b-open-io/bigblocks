export interface OrdfsImageLoaderArgs {
  /** Absolute URL of the original ORDFS content */
  src: string
  /** Target width in pixels */
  width: number
  /** Quality hint, 1-100 */
  quality: number
}

/**
 * Rewrites an ORDFS content URL to an optimized one.
 *
 * ORDFS serves inscriptions at their original size — a single NFT is routinely
 * several megabytes — so a grid of them is the dominant cost in any wallet or
 * marketplace UI. A loader points that URL at whatever optimizer the host
 * already provides, which keeps these blocks plain React with no
 * framework-specific imports that would break a Vite or Astro consumer.
 */
export type OrdfsImageLoader = (args: OrdfsImageLoaderArgs) => string

/**
 * Widths used to build `srcSet`. Mirrors the common device-size ladder so a
 * host optimizer that caches per width sees a small, predictable key space.
 */
export const DEFAULT_IMAGE_WIDTHS = [64, 128, 256, 384, 640, 828, 1200, 1920]

/** Default quality passed to loaders when a caller does not specify one */
export const DEFAULT_IMAGE_QUALITY = 75

/**
 * Routes through Vercel's image optimizer.
 *
 * This targets the `/_next/image` endpoint directly rather than importing
 * `next/image`, so it works from any framework deployed on Vercel and keeps
 * the blocks installable in Vite, Remix, and Astro projects.
 *
 * The ORDFS host must be allowlisted in `next.config`:
 *
 * ```js
 * images: {
 *   remotePatterns: [{ protocol: "https", hostname: "ordfs.network" }],
 * }
 * ```
 *
 * @example
 * ```tsx
 * <BigBlocksProvider imageLoader={vercelImageLoader}>
 * ```
 */
export const vercelImageLoader: OrdfsImageLoader = ({ src, width, quality }) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`

/**
 * Routes through Cloudflare Image Resizing.
 *
 * Requires Image Resizing enabled on the zone serving your site.
 *
 * @param zone - Origin to prefix the transform path with. Defaults to a
 *   same-origin path, which is correct when your site is on the same zone.
 */
export function createCloudflareImageLoader(zone = ""): OrdfsImageLoader {
  return ({ src, width, quality }) =>
    `${zone}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${src}`
}

/**
 * Routes through an ORDFS gateway's `/image` transform endpoint.
 *
 * Preferred when available: one shared cache serves every consumer, so no
 * individual app pays per-image transformation costs, and the gateway
 * negotiates AVIF or WebP from the browser's own Accept header.
 *
 * @param base - Gateway origin, e.g. `https://ordfs.network`
 * @param options - Optional fit mode and gravity, matching the gateway's
 *   Cloudinary-style vocabulary. Defaults to `limit`, which fits within the
 *   width without upscaling.
 */
export function createOrdfsImageLoader(
  base: string,
  options: { fit?: "limit" | "fit" | "fill" | "pad" | "scale"; gravity?: string } = {}
): OrdfsImageLoader {
  const origin = base.replace(/\/$/, "")
  return ({ src, width, quality }) => {
    const pointer = src.split("/content/").pop() ?? src.split("/").pop() ?? src
    const params = new URLSearchParams({ w: String(width), q: String(quality) })
    if (options.fit) params.set("fit", options.fit)
    if (options.gravity) params.set("g", options.gravity)
    return `${origin}/image/${pointer}?${params}`
  }
}

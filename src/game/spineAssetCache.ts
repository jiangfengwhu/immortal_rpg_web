import { Assets } from 'pixi.js'

const inflightLoads = new Map<string, Promise<unknown>>()

export function getCachedSpineAsset<T>(assetKey: string): T | undefined {
  if (Assets.cache.has(assetKey)) {
    return Assets.get<T>(assetKey)
  }

  return undefined
}

export function storeSpineAsset<T extends object>(assetKey: string, resource: T): T {
  const cached = getCachedSpineAsset<T>(assetKey)
  if (cached) {
    return cached
  }

  Assets.cache.set(assetKey, resource)
  return resource
}

export async function dedupeSpineAssetLoad<T>(
  assetKey: string,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = getCachedSpineAsset<T>(assetKey)
  if (cached) {
    return cached
  }

  const inflight = inflightLoads.get(assetKey)
  if (inflight) {
    return inflight as Promise<T>
  }

  const promise = loader()
  inflightLoads.set(assetKey, promise)

  try {
    return await promise
  } finally {
    inflightLoads.delete(assetKey)
  }
}

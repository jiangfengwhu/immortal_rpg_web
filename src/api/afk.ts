type AfkPayload = {
  playerId: string
  feature: string
}

export type AfkLootItem = {
  itemId: string
  name: string
  count: number
}

export type AfkClaimResult = {
  feature: string
  expGained: number
  goldGained: number
  narrative?: string
  loot?: AfkLootItem[]
  active?: boolean
}

type AfkTickResponse = {
  claim?: AfkClaimResult
  player?: import('./player').PlayerFullState
  skipped?: boolean
  active?: boolean
  error?: string
}

export type AfkTickOutcome =
  | { ok: true; skipped?: boolean; narrative?: string; loot?: AfkLootItem[] }
  | { ok: false; message: string }

async function postAfk(path: string, payload: AfkPayload): Promise<AfkTickResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await response.json()) as AfkTickResponse
  if (!response.ok) {
    throw new Error(data.error ?? `采集请求失败 (${response.status})`)
  }
  return data
}

export async function startAfkSession(payload: AfkPayload): Promise<AfkTickResponse> {
  return postAfk('/api/afk/start', payload)
}

export async function stopAfkSession(payload: AfkPayload): Promise<AfkTickResponse> {
  return postAfk('/api/afk/stop', payload)
}

export async function tickAfkSession(payload: AfkPayload): Promise<AfkTickResponse> {
  return postAfk('/api/afk/tick', payload)
}

import type { PlayerFullState, BattleResult } from './player'

type ApiError = { error?: string }

export async function startWildBattle(playerId: string) {
  const response = await fetch('/api/battle/wild', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as { result: BattleResult; player: PlayerFullState } & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `野外战斗结算失败 (${response.status})`)
  }
  return data
}

export async function resolveAdventure(playerId: string, choiceId: string) {
  const response = await fetch('/api/adventure/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, choiceId }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `决断奇遇失败 (${response.status})`)
  }
  return data
}

export async function refreshBounties(playerId: string) {
  const response = await fetch('/api/bounties/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `刷新悬赏失败 (${response.status})`)
  }
  return data
}

export async function acceptBounty(playerId: string, bountyId: string) {
  const response = await fetch('/api/bounties/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, bountyId }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `接取悬赏失败 (${response.status})`)
  }
  return data
}

export async function claimBounty(playerId: string, bountyId: string) {
  const response = await fetch('/api/bounties/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, bountyId }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `交付悬赏失败 (${response.status})`)
  }
  return data
}

export async function hatchPet(playerId: string) {
  const response = await fetch('/api/pet/hatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  })
  const data = (await response.json()) as { fullState: PlayerFullState; newPet: any } & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `孵化灵宠失败 (${response.status})`)
  }
  return data
}

export async function mutatePet(playerId: string, petId: string) {
  const response = await fetch('/api/pet/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, petId }),
  })
  const data = (await response.json()) as { fullState: PlayerFullState; mutateSuccess: boolean; narrative: string; pet: any } & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `变异灵宠失败 (${response.status})`)
  }
  return data
}

export async function activatePet(playerId: string, petId: string) {
  const response = await fetch('/api/pet/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, petId }),
  })
  const data = (await response.json()) as PlayerFullState & ApiError
  if (!response.ok) {
    throw new Error(data.error ?? `激活灵宠失败 (${response.status})`)
  }
  return data
}


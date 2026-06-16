export class PlayerNotFoundError extends Error {
  constructor() {
    super('player not found')
    this.name = 'PlayerNotFoundError'
  }
}

export function isPlayerNotFoundError(error: unknown) {
  return error instanceof PlayerNotFoundError
}

export type ToastTone = 'info' | 'warn' | 'success'

export type GameToast = {
  id: string
  text: string
  tone: ToastTone
  persistent?: boolean
}

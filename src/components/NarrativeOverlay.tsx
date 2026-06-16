import { useEffect, useState } from 'react'

import type { NarrativeBeat } from '../game/quest/story.types'

type NarrativeOverlayProps = {
  beats: NarrativeBeat[]
  onComplete: () => Promise<void> | void
}

export function NarrativeOverlay({ beats, onComplete }: NarrativeOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  const activeBeat = beats[currentIndex]

  // 打字机效果
  useEffect(() => {
    if (!activeBeat) return
    
    setTypedText('')
    setIsTypingComplete(false)
    
    let index = 0
    const text = activeBeat.text
    const interval = setInterval(() => {
      if (index < text.length) {
        setTypedText((prev) => prev + text.charAt(index))
        index++
      } else {
        setIsTypingComplete(true)
        clearInterval(interval)
      }
    }, 25)

    return () => clearInterval(interval)
  }, [activeBeat])

  // 处理前进
  const handleAdvance = () => {
    if (!isTypingComplete && activeBeat) {
      // 如果还没打完，直接显示全文
      setTypedText(activeBeat.text)
      setIsTypingComplete(true)
      return
    }

    if (currentIndex < beats.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // 读完最后一个，调用完成
      void onComplete()
    }
  }

  // 键盘监听（空格/回车推进）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleAdvance()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isTypingComplete, beats])

  if (!activeBeat) return null

  // 不同的 mood 对应不同的底色叠加，增强氛围感
  let moodClass = ''
  if (activeBeat.mood === 'danger') moodClass = 'narrative-overlay--danger'
  else if (activeBeat.mood === 'dark') moodClass = 'narrative-overlay--dark'
  else if (activeBeat.mood === 'dawn') moodClass = 'narrative-overlay--dawn'
  else if (activeBeat.mood === 'fate') moodClass = 'narrative-overlay--fate'

  const speakerName = activeBeat.speaker || '旁白'
  const isNarrator = speakerName === '旁白'

  return (
    <div className={`narrative-overlay-container ${moodClass}`} onClick={handleAdvance}>
      <div className="narrative-overlay-card" onClick={(e) => e.stopPropagation()}>
        <div className="narrative-overlay-card__header">
          <span className={`narrative-overlay-card__speaker ${isNarrator ? 'narrative-overlay-card__speaker--narrator' : ''}`}>
            {speakerName}
          </span>
        </div>
        <div className="narrative-overlay-card__body">
          <p className="narrative-overlay-card__text">
            {typedText}
            {!isTypingComplete && <span className="narrative-typing-cursor">|</span>}
          </p>
        </div>
        <div className="narrative-overlay-card__footer">
          <span className="narrative-overlay-card__prompt" onClick={handleAdvance}>
            {isTypingComplete ? '点击继续 ➔' : '点击跳过打字 ➔'}
          </span>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'


type BuzzerProps = {
  sessionCode?: string | null
  onBack?: () => void
  playerLabel?: string
  playerName: string
}

export default function Buzzer({ sessionCode, onBack, playerLabel, playerName = 'Joueur' }: BuzzerProps) {
  const [isPressed, setIsPressed] = useState(false)
  const releaseTimeoutRef = useRef<number | null>(null)

  const triggerPress = useCallback(() => {
    if (releaseTimeoutRef.current) {
      window.clearTimeout(releaseTimeoutRef.current)
    }

    setIsPressed(true)

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30)
    }

    releaseTimeoutRef.current = window.setTimeout(() => {
      setIsPressed(false)
      releaseTimeoutRef.current = null
    }, 180)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        triggerPress()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [triggerPress])

  useEffect(() => {
    return () => {
      if (releaseTimeoutRef.current) {
        window.clearTimeout(releaseTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="buzzerPage">
      <header className="buzzerHeader">
        <div className="buzzerHeaderLeft">
          {onBack ? (
            <button className="btnSecondary" type="button" onClick={onBack}>
              Retour
            </button>
          ) : null}
        </div>

        <div className="buzzerHeaderCenter">
          <div className="buzzerTitle">{ playerName || playerLabel }</div>
          {sessionCode ? <div className="buzzerSession">Session {sessionCode}</div> : null}
        </div>

        <div className="buzzerHeaderRight" />
      </header>

      <main className="buzzerMain">
        <button
          className={`buzzerButton${isPressed ? ' isPressed' : ''}`}
          type="button"
          onClick={triggerPress}
          aria-pressed={isPressed}
        >
          BUZZ
        </button>
      </main>
    </div>
  )
}

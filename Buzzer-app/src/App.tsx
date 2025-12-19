import { useMemo, useState } from 'react'
import './App.css'

function generateSessionCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizeCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

function App() {
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const title = useMemo(() => 'Buzzer', [])

  const onCreateSession = () => {
    setCreatedCode(generateSessionCode())
    setCopyState('idle')
    setJoinError(null)
  }

  const onCopyCode = async () => {
    if (!createdCode) return
    try {
      await navigator.clipboard.writeText(createdCode)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1200)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const onJoinSession = () => {
    setJoinError(null)
    if (joinCode.length !== 6) {
      setJoinError('Entre un code à 6 chiffres.')
      return
    }
    alert(`Join session: ${joinCode}`)
  }

  return (
    <div className="app">
      <header className="appHeader">
        <h1 className="appTitle">{title}</h1>
      </header>

      <main className="appMain">
        <section className="homeCard" aria-label="Gestion des sessions">
          <div className="homeBlock">
            <h2 className="homeBlockTitle">Créer une session</h2>
            <p className="homeBlockText">Génère un code à 6 chiffres pour inviter des joueurs.</p>

            <div className="homeActions">
              <button className="btnPrimary" type="button" onClick={onCreateSession}>
                Créer une session
              </button>
            </div>

            {createdCode ? (
              <div className="codeBox" role="status" aria-live="polite">
                <div className="codeValue">{createdCode}</div>
                <button className="btnSecondary" type="button" onClick={onCopyCode}>
                  {copyState === 'copied' ? 'Copié' : copyState === 'error' ? 'Erreur' : 'Copier'}
                </button>
              </div>
            ) : null}
          </div>

          <div className="homeDivider" />

          <div className="homeBlock">
            <h2 className="homeBlockTitle">Rejoindre une session</h2>
            <p className="homeBlockText">Entre le code à 6 chiffres que l’hôte t’a donné.</p>

            <div className="joinRow">
              <input
                className="codeInput"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="123456"
                aria-label="Code de session"
                value={joinCode}
                onChange={(e) => setJoinCode(normalizeCode(e.target.value))}
              />
              <button className="btnPrimary" type="button" onClick={onJoinSession}>
                Rejoindre
              </button>
            </div>

            {joinError ? <div className="errorText">{joinError}</div> : null}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

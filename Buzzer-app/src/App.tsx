import { useMemo, useState } from 'react'
import './App.css'
import Buzzer from './buzzer'
import { generateSessionCode, isValidSessionCode, normalizeSessionCode } from './session'

function App() {
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [screen, setScreen] = useState<'home' | 'buzzer'>('home')
  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(null)
  const [playerLabel, setPlayerLabel] = useState<'Hôte' | 'Joueur'>('Joueur')

  const title = useMemo(() => 'Buzzer', [])

  const onCreateSession = () => {
    const code = generateSessionCode()
    setCreatedCode(code)
    setActiveSessionCode(code)
    setPlayerLabel('Hôte')
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
    if (!isValidSessionCode(joinCode)) {
      setJoinError('Entre un code à 6 chiffres.')
      return
    }
    setActiveSessionCode(joinCode)
    setPlayerLabel('Joueur')
    setScreen('buzzer')
  }

  const onGoToBuzzer = () => {
    if (!activeSessionCode) return
    setScreen('buzzer')
  }

  if (screen === 'buzzer') {
    return (
      <Buzzer
        sessionCode={activeSessionCode}
        playerLabel={playerLabel}
        onBack={() => setScreen('home')}
      />
    )
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

            {createdCode ? (
              <div className="homeActions">
                <button className="btnPrimary" type="button" onClick={onGoToBuzzer}>
                  Aller au buzzer
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
                onChange={(e) => setJoinCode(normalizeSessionCode(e.target.value))}
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

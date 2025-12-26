import { useMemo, useState } from 'react'

import Buzzer from './buzzer'
import { generateSessionCode, isValidSessionCode, normalizeSessionCode } from './session'
import PlayerNameInput from './components/PlayerNameInput' 
import { 
  createSession, 
  joinSession, 
  deleteSession, 
  checkSessionExists 
} from './firebaseService'

function App() {
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [screen, setScreen] = useState<'home' | 'buzzer'>('home')
  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(null)
  const [playerLabel, setPlayerLabel] = useState<'Hôte' | 'Joueur'>('Joueur')
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const title = useMemo(() => 'Buzzer', [])

  const onCreateSession = async () => {
    if (!playerName.trim()) {
      setJoinError('Entre ton nom avant de créer une session')
      return
    }

 setIsLoading(true)
    const code = generateSessionCode()

      // Créer la session dans Firebase
    const result = await createSession(code, playerName)

    if (result.success) {
      setCreatedCode(code)
      setActiveSessionCode(code)
      setPlayerLabel('Hôte')
      setCopyState('idle')
      setJoinError(null)
    } else {
      setJoinError('Erreur lors de la création de la session')
    }
    
    setIsLoading(false)
  }

  const onCopyCode = async () => {
    if (!createdCode) return
    try {
      await navigator.clipboard.writeText(createdCode)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1200)
    } catch {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const onJoinSession = async () => {
    setJoinError(null)

    if (!playerName.trim()) {
      setJoinError('Entre ton nom avant de rejoindre')
      return
    }

    if (!isValidSessionCode(joinCode)) {
      setJoinError('Entre un code à 6 chiffres.')
      return
    }

    setIsLoading(true)

    const exists = await checkSessionExists(joinCode)
    
    if (!exists) {
      setJoinError('Cette session n\'existe pas ou a expiré.')
      setIsLoading(false)
      return
    }

     // Rejoindre la session
    const result = await joinSession(joinCode, playerName)
    
    if (result.success) {
      setActiveSessionCode(joinCode)
      setPlayerLabel('Joueur')
      setScreen('buzzer')
      setJoinError(null)
    } else {
      setJoinError(result.error)
    }
    
    setIsLoading(false)
  }
  
  const onGoToBuzzer = () => {
    if (!activeSessionCode) return
    setScreen('buzzer')
  }

const onBackToHome = async () => {
    // Si l'utilisateur est l'hôte, supprimer la session
    if (playerLabel === 'Hôte' && activeSessionCode) {
      await deleteSession(activeSessionCode)
    }
    
    setScreen('home')
    setActiveSessionCode(null)
    setCreatedCode(null)
    setJoinCode('')
    setJoinError(null)
  }

  if (screen === 'buzzer') {
    return (
      <Buzzer
        sessionCode={activeSessionCode}
        playerLabel={playerLabel}
        playerName={playerName}
        onBack={onBackToHome}
      />
    )
  }

  return (
    <div className="app">
      <header className="appHeader">
        <h1 className="appTitle">{title}</h1>
      </header>

      <main className="appMain">
        <PlayerNameInput  
            value={playerName}
            onChange={setPlayerName}
          />

        <section className="homeCard" aria-label="Gestion des sessions">
          <div className="homeBlock">
            <h2 className="homeBlockTitle">Créer une session</h2>
            <p className="homeBlockText">Génère un code à 6 chiffres pour inviter des joueurs.</p>

            <div className="homeActions">
              <button className="btnPrimary"
                type="button" 
                onClick={onCreateSession}
                disabled={isLoading || !playerName.trim()}
                >
                  {isLoading ? 'Création...' : 'Créer une session'}
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
              <button className="btnPrimary" type="button" onClick={onJoinSession}
              disabled={isLoading || !playerName.trim()}>
                {isLoading ? 'Connexion...' : 'Rejoindre'}
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
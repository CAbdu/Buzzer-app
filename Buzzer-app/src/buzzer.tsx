// buzzer.tsx
import { useEffect, useState } from 'react'
import { listenToSession, pressBuzzer, resetBuzzer } from './firebaseService'

interface BuzzerProps {
  sessionCode: string | null
  playerLabel: 'Hôte' | 'Joueur'
  playerName: string
  onBack: () => void
}

interface Player {
  name: string
  joinedAt: number
}

interface SessionData {
  hostName: string
  players: Record<string, Player>
  buzzerPressed: {
    playerName: string
    timestamp: number
  } | null
}

export default function Buzzer({ sessionCode, playerLabel, playerName, onBack }: BuzzerProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isPressed, setIsPressed] = useState(false)

  // ========================================
  // ÉCOUTER LES CHANGEMENTS EN TEMPS RÉEL
  // ========================================
 
  useEffect(() => {
    if (!sessionCode) return

    // S'abonner aux changements
    const unsubscribe = listenToSession(sessionCode, (data) => {
      if (data) {
        // Transformer les données Firebase pour correspondre à l'interface locale
        const transformedData: SessionData = {
          hostName: data.hostName,
          players: Object.fromEntries(
            Object.entries(data.players).map(([key, player]) => [
              key,
              {
                name: player.name,
                joinedAt: typeof player.joinedAt === 'object' && '.sv' in player.joinedAt 
                  ? Date.now() // Pour le server timestamp, utiliser le temps actuel
                  : player.joinedAt
              }
            ])
          ),
          buzzerPressed: data.buzzerPressed ? {
            playerName: data.buzzerPressed.playerName,
            timestamp: typeof data.buzzerPressed.timestamp === 'object' && '.sv' in data.buzzerPressed.timestamp
              ? Date.now() // Pour le server timestamp, utiliser le temps actuel
              : data.buzzerPressed.timestamp
          } : null
        }
        setSessionData(transformedData)
      } else {
        setSessionData(null)
      }
    })

    // Se désabonner au démontage
    return () => {
      unsubscribe()
    }
  }, [sessionCode])

  // ========================================
  // APPUYER SUR LE BUZZER
  // ========================================
  const handleBuzzerPress = async () => {
    if (!sessionCode || isPressed || sessionData?.buzzerPressed) return

    setIsPressed(true)
    const result = await pressBuzzer(sessionCode, playerName)
    
    if (!result.success) {
      console.log(result.error)
    }
    
    // Désactiver le bouton pendant 1 seconde
    setTimeout(() => setIsPressed(false), 1000)
  }

  // ========================================
  // RÉINITIALISER LE BUZZER (Hôte uniquement)
  // ========================================
  const handleReset = async () => {
    if (!sessionCode || playerLabel !== 'Hôte') return
    await resetBuzzer(sessionCode)
  }

  // ========================================
  // CALCULER LA LISTE DES JOUEURS
  // ========================================
  const playersList = sessionData?.players 
    ? Object.values(sessionData.players) 
    : []

  const totalPlayers = playersList.length + 1 // +1 pour l'hôte

  return (
    <div className="buzzerContainer">
      {/* HEADER */}
      <div className="buzzerHeader">
        <button className="btnBack" onClick={onBack}>
          ← Retour
        </button>
        
        <div className="buzzerHeaderCenter">
          <div className="buzzerTitle">{playerName || playerLabel}</div>
          {sessionCode && (
            <div className="buzzerSession">Session {sessionCode}</div>
          )}
        </div>
        
        <div className="buzzerPlayers">
          👥 {totalPlayers} joueur{totalPlayers > 1 ? 's' : ''}
        </div>
      </div>

      {/* LISTE DES JOUEURS */}
      <div className="playersListContainer">
        <h3>Joueurs connectés :</h3>
        <ul className="playersList">
          <li className="playerItem">
            <span className="playerName">{sessionData?.hostName || playerName}</span>
            <span className="playerBadge">Hôte</span>
          </li>
          {playersList.map((player, index) => (
            <li key={index} className="playerItem">
              <span className="playerName">{player.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* BUZZER */}
      <div className="buzzerMain">
        {sessionData?.buzzerPressed ? (
          <div className="buzzerResult">
            <div className="winnerText">
              🏆 {sessionData.buzzerPressed.playerName} a gagné !
            </div>
            {playerLabel === 'Hôte' && (
              <button className="btnReset" onClick={handleReset}>
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <button
            className={`buzzerButton ${isPressed ? 'pressed' : ''}`}
            onClick={handleBuzzerPress}
            disabled={isPressed}
          >
            {isPressed ? 'Appuyé !' : 'BUZZER'}
          </button>
        )}
      </div>
    </div>
  )
}
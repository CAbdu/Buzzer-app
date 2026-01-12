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
  buzzerStartTime: number | null
}

interface RankingEntry {
  playerName: string
  reactionTime: number
}

export default function Buzzer({ sessionCode, playerLabel, playerName, onBack }: BuzzerProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [ranking, setRanking] = useState<RankingEntry[]>([])

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
          } : null,
          buzzerStartTime: data.buzzerStartTime ? (
            typeof data.buzzerStartTime === 'object' && '.sv' in data.buzzerStartTime
              ? Date.now() // Pour le server timestamp, utiliser le temps actuel
              : data.buzzerStartTime
          ) : null
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
    } else {
      // Calculer et ajouter au classement
      const reactionTime = sessionData?.buzzerStartTime ? Date.now() - sessionData.buzzerStartTime : 0
      if (reactionTime > 0) {
        setRanking(prev => {
          const newRanking = [...prev, { playerName, reactionTime }]
          return newRanking.sort((a, b) => a.reactionTime - b.reactionTime)
        })
      }
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
    setRanking([]) // Réinitialiser le classement
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
      <div className="beforeBuzzer">
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
      </div>

      {/* BUZZER */}
      <div className="buzzerMain">
        {/* CLASSEMENT */}
        {ranking.length > 0 && (
          <div className="rankingContainer">
            <h3 className="rankingTitle">🏆 Classement</h3>
            <ul className="rankingList">
              {ranking.map((entry, index) => (
                <li key={index} className="rankingItem">
                  <span className="rankingPosition">{index + 1}.</span>
                  <span className="rankingPlayerName">{entry.playerName}</span>
                  <span className="rankingTime">{(entry.reactionTime / 1000).toFixed(3)}s</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
            {isPressed ? 'BZZZ!' : 'BUZZER'}
          </button>
        )}
      </div>
    </div>
  )
}
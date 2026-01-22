// buzzer.tsx
import { useEffect, useState } from 'react'
import { closeBuzzerWindow, listenToSession, pressBuzzer, resetBuzzer } from './firebaseService'

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
  buzzerWindowStart: number | null
  buzzerWindowClosed: boolean
  buzzerPresses: Record<string, {
    playerName: string
    clientTimestamp: number | null
    timestamp: number | null
  }>
}

interface RankingEntry {
  playerName: string
  reactionTime: number | null
}

export default function Buzzer({ sessionCode, playerLabel, playerName, onBack }: BuzzerProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isPressed, setIsPressed] = useState(false)

  const toFirebaseKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[.#$[\]/]/g, '_')

  // ========================================
  // ÉCOUTER LES CHANGEMENTS EN TEMPS RÉEL
  // ========================================
  useEffect(() => {
    if (!sessionCode) return

    const unsubscribe = listenToSession(sessionCode, (data) => {
      if (data) {
        const buzzerPresses: Record<string, { playerName: string; clientTimestamp: number | null; timestamp: number | null }> = data.buzzerPresses
          ? Object.fromEntries(
              Object.entries(data.buzzerPresses).map(([key, press]) => [
                key,
                {
                  playerName: press.playerName,
                  clientTimestamp:
                    typeof press.clientTimestamp === 'number'
                      ? press.clientTimestamp
                      : typeof press.timestamp === 'number'
                        ? press.timestamp
                        : null,
                  timestamp:
                    typeof press.timestamp === 'object' && '.sv' in press.timestamp
                      ? null
                      : press.timestamp
                }
              ])
            )
          : {}

        const transformedData: SessionData = {
          hostName: data.hostName,
          players: Object.fromEntries(
            Object.entries(data.players || {}).map(([key, player]) => [
              key,
              {
                name: player.name,
                joinedAt: typeof player.joinedAt === 'object' && '.sv' in player.joinedAt
                  ? Date.now()
                  : player.joinedAt
              }
            ])
          ),
          buzzerPressed: data.buzzerPressed ? {
            playerName: data.buzzerPressed.playerName,
            timestamp: typeof data.buzzerPressed.timestamp === 'object' && '.sv' in data.buzzerPressed.timestamp
              ? Date.now()
              : data.buzzerPressed.timestamp
          } : null,
          buzzerStartTime: data.buzzerStartTime ? (
            typeof data.buzzerStartTime === 'object' && '.sv' in data.buzzerStartTime
              ? Date.now()
              : data.buzzerStartTime
          ) : null,
          buzzerWindowStart: data.buzzerWindowStart
            ? (typeof data.buzzerWindowStart === 'object' && '.sv' in data.buzzerWindowStart
                ? Date.now()
                : data.buzzerWindowStart)
            : null,
          buzzerWindowClosed: data.buzzerWindowClosed ?? false,
          buzzerPresses
        }
        
        setSessionData(transformedData)
      } else {
        setSessionData(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [sessionCode])

  // ========================================
  // FERMER LA FENÊTRE APRÈS 2 SECONDES
  // ========================================
  useEffect(() => {
    if (!sessionCode || playerLabel !== 'Hôte') return
    if (!sessionData?.buzzerWindowStart || sessionData.buzzerWindowClosed) return

    const timeout = setTimeout(() => {
      closeBuzzerWindow(sessionCode)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [playerLabel, sessionCode, sessionData?.buzzerWindowStart, sessionData?.buzzerWindowClosed])

  // ========================================
  // APPUYER SUR LE BUZZER
  // ========================================
  const handleBuzzerPress = async () => {
    if (!sessionCode || isPressed) return

    if (sessionData?.buzzerWindowClosed) {
      return
    }

    const isRoundOpen = !!sessionData?.buzzerWindowStart
    const currentKey = toFirebaseKey(playerName)
    const hasAlreadyPressedThisRound = isRoundOpen && !!sessionData?.buzzerPresses?.[currentKey]
    
    if (hasAlreadyPressedThisRound) {
      return
    }

    setIsPressed(true)
    const result = await pressBuzzer(sessionCode, playerName)

    if (!result.success) {
      console.log('❌ Erreur:', result.error)
    }

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

  const totalPlayers = playersList.length + 1

  // ========================================
  // CALCULER LE CLASSEMENT À PARTIR DE FIREBASE
  // ========================================
  const pressesList = sessionData?.buzzerPresses ? Object.values(sessionData.buzzerPresses) : []
  const validPresses = pressesList.filter(
    (p): p is { playerName: string; clientTimestamp: number; timestamp: number | null } =>
      typeof p.clientTimestamp === 'number' && Number.isFinite(p.clientTimestamp)
  )
  const firstTimestamp = validPresses.length > 0 ? Math.min(...validPresses.map((p) => p.clientTimestamp)) : null

  const ranking: RankingEntry[] = pressesList
    .map((p) => ({
      playerName: p.playerName,
      reactionTime:
        firstTimestamp === null || p.clientTimestamp === null
          ? null
          : p.clientTimestamp - firstTimestamp
    }))
    .sort((a, b) => (a.reactionTime ?? Number.POSITIVE_INFINITY) - (b.reactionTime ?? Number.POSITIVE_INFINITY))

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
        {/* CLASSEMENT - Affiché s'il y a des appuis */}
        {ranking.length > 0 && (
          <div className="rankingContainer">
            <h3 className="rankingTitle">🏆 Classement</h3>
            <ul className="rankingList">
              {ranking.map((entry, index) => (
                <li key={index} className="rankingItem">
                  <span className="rankingPosition">{index + 1}.</span>
                  <span className="rankingPlayerName">{entry.playerName}</span>
                  <span className="rankingTime">
                    {entry.reactionTime === null ? '0.000s' : `${(entry.reactionTime / 1000).toFixed(3)}s`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Afficher le bouton de reset pour l'hôte si la fenêtre est fermée */}
        {sessionData?.buzzerWindowClosed && playerLabel === 'Hôte' && (
          <div className="buzzerResult">
            <div className="winnerText">
              🏆 Manche terminée !
            </div>
            <button className="btnReset" onClick={handleReset}>
              Réinitialiser
            </button>
          </div>
        )}

        {/* Afficher le buzzer si la fenêtre n'est pas fermée */}
        {!sessionData?.buzzerWindowClosed && (
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
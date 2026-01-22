import { ref, set, get, onValue, remove, push, serverTimestamp, update } from 'firebase/database'
import { database } from './firebase'

type ServiceResult = 
  | { success: true; playerId?: string }
  | { success: false; error: string }

interface SessionData {
  hostName: string;
  createdAt: {
    '.sv': string;
  };
  players: Record<string, {
    name: string;
    joinedAt: {
      '.sv': string;
    };
  }>;
  buzzerPressed: {
    playerName: string;
    timestamp: {
      '.sv': string;
    };
  } | null;
  buzzerStartTime: {
    '.sv': string;
  } | null;
  buzzerWindowStart: number | { '.sv': string } | null;
  buzzerWindowClosed: boolean;
  buzzerPresses?: Record<string, {
    playerName: string;
    clientTimestamp: number;
    timestamp: number | { '.sv': string };
  }>;
}

const toFirebaseKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[.#$[\]/]/g, '_')

// ========================================
// 1. CRÉER UNE SESSION
// ========================================
export const createSession = async (code: string, hostName: string): Promise<ServiceResult> => {
  try {
    const sessionRef = ref(database, `sessions/${code}`)
    
    await set(sessionRef, {
      hostName,
      createdAt: serverTimestamp(),
      players: {},
      buzzerPressed: null,
      buzzerStartTime: serverTimestamp(),
      buzzerWindowStart: null,
      buzzerWindowClosed: false,
      buzzerPresses: {}
    })
    
    console.log(`✅ Session ${code} créée par ${hostName}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur création session:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

export const checkSessionExists = async (code: string): Promise<boolean> => {
  try {
    const sessionRef = ref(database, `sessions/${code}`)
    const snapshot = await get(sessionRef)
    return snapshot.exists()
  } catch (error) {
    console.error('❌ Erreur vérification session:', error)
    return false
  }
}

export const joinSession = async (code: string, playerName: string): Promise<ServiceResult> => {
  try {
    const exists = await checkSessionExists(code)
    if (!exists) {
      return { success: false, error: 'Session introuvable' }
    }

    const playersRef = ref(database, `sessions/${code}/players`)
    const newPlayerRef = push(playersRef)
    
    await set(newPlayerRef, {
      name: playerName,
      joinedAt: serverTimestamp()
    })
    
    console.log(`✅ ${playerName} a rejoint la session ${code}`)
    return { success: true, playerId: newPlayerRef.key || undefined }
  } catch (error) {
    console.error('❌ Erreur rejoindre session:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur de connexion'
    }
  }
}

export const listenToSession = (
  code: string, 
  callback: (data: SessionData | null) => void
) => {
  const sessionRef = ref(database, `sessions/${code}`)
  
  return onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    } else {
      callback(null)
    }
  })
}

export const pressBuzzer = async (code: string, playerName: string): Promise<ServiceResult> => {
  try {
    const sessionRef = ref(database, `sessions/${code}`)
    const windowStartRef = ref(database, `sessions/${code}/buzzerWindowStart`)
    const windowClosedRef = ref(database, `sessions/${code}/buzzerWindowClosed`)

    const key = toFirebaseKey(playerName)
    const playerPressRef = ref(database, `sessions/${code}/buzzerPresses/${key}`)

    // Vérifier si la fenêtre est fermée
    const windowClosedSnap = await get(windowClosedRef)
    const windowClosed = windowClosedSnap.exists() ? windowClosedSnap.val() : false

    if (windowClosed) {
      return { success: false, error: 'Manche terminée, en attente du reset' }
    }

    const windowStartSnap = await get(windowStartRef)
    const windowStart = windowStartSnap.exists() ? windowStartSnap.val() : null

    if (windowStart) {
      // Il y a déjà une fenêtre ouverte
      const existingPress = await get(playerPressRef)
      if (existingPress.exists()) {
        return { success: false, error: 'Déjà appuyé !' }
      }

      // Vérifier si les 2 secondes sont écoulées
      if (typeof windowStart === 'number') {
        const elapsedMs = Date.now() - windowStart
        if (elapsedMs > 2000) {
          return { success: false, error: 'Trop tard !' }
        }
      }

      // Enregistrer l'appui
      await set(playerPressRef, {
        playerName,
        clientTimestamp: Date.now(),
        timestamp: serverTimestamp()
      })

      console.log(`🔔 ${playerName} a appuyé !`)
      return { success: true }
    }

    // Premier appui - ouvrir la fenêtre
    await update(sessionRef, {
      buzzerWindowStart: serverTimestamp(),
      buzzerWindowClosed: false,
      buzzerPresses: {
        [key]: {
          playerName,
          clientTimestamp: Date.now(),
          timestamp: serverTimestamp()
        }
      }
    })

    console.log(`🔔 ${playerName} a ouvert la fenêtre !`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur buzzer:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur buzzer'
    }
  }
}

// Fermer la fenêtre de buzzer (appelé par l'hôte après 2 secondes)
export const closeBuzzerWindow = async (code: string): Promise<ServiceResult> => {
  try {
    const windowClosedRef = ref(database, `sessions/${code}/buzzerWindowClosed`)
    await set(windowClosedRef, true)
    console.log(`🔒 Fenêtre de buzzer fermée pour ${code}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur fermeture manche:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur fermeture manche'
    }
  }
}

export const resetBuzzer = async (code: string): Promise<ServiceResult> => {
  try {
    const buzzerRef = ref(database, `sessions/${code}/buzzerPressed`)
    const startTimeRef = ref(database, `sessions/${code}/buzzerStartTime`)
    const windowStartRef = ref(database, `sessions/${code}/buzzerWindowStart`)
    const windowClosedRef = ref(database, `sessions/${code}/buzzerWindowClosed`)
    const pressesRef = ref(database, `sessions/${code}/buzzerPresses`)
    
    // Tout réinitialiser pour une nouvelle manche
    await set(buzzerRef, null)
    await set(startTimeRef, serverTimestamp())
    await set(windowStartRef, null)
    await set(windowClosedRef, false)
    await set(pressesRef, {})
    
    console.log(`🔄 Buzzer réinitialisé pour la session ${code}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur reset buzzer:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur reset'
    }
  }
}

export const deleteSession = async (code: string): Promise<ServiceResult> => {
  try {
    const sessionRef = ref(database, `sessions/${code}`)
    await remove(sessionRef)
    console.log(`🗑️ Session ${code} supprimée`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur suppression session:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur suppression'
    }
  }
}
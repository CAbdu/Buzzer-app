import { ref, set, get, onValue, remove, push, serverTimestamp } from 'firebase/database'
import { database } from './firebase'

type ServiceResult = 
  | { success: true; playerId?: string }
  | { success: false; error: string }

interface SessionData {
  hostName: string;
  createdAt: {
    '.sv': string; // serverTimestamp
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
}
// ========================================
// 1. CRÉER UNE SESSION
// ========================================
export const createSession = async (code: string, hostName: string): Promise<ServiceResult> => {
  try {
    const sessionRef = ref(database, `sessions/${code}`)
    
    await set(sessionRef, {
      hostName,
      createdAt: serverTimestamp(), // Timestamp du serveur Firebase
      players: {},
      buzzerPressed: null,
      buzzerStartTime: serverTimestamp()
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
    // Vérifier que la session existe
    const exists = await checkSessionExists(code)
    if (!exists) {
      return { success: false, error: 'Session introuvable' }
    }

    // Ajouter le joueur à la session
    const playersRef = ref(database, `sessions/${code}/players`)
    const newPlayerRef = push(playersRef) // Génère un ID unique
    
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
  
  // onValue écoute les changements en temps réel
  return onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    } else {
      callback(null)
    }
  })
}

export const pressBuzzer = async (code: string, playerName: string): Promise<ServiceResult & { winner?: string }>  => {
  try {
    const buzzerRef = ref(database, `sessions/${code}/buzzerPressed`)
    
    // Vérifier si quelqu'un a déjà appuyé
    const snapshot = await get(buzzerRef)
    if (snapshot.exists()) {
      return { 
        success: false, 
        error: 'Quelqu\'un a déjà appuyé !',
        winner: snapshot.val().playerName
      }
    }

    // Enregistrer le premier qui appuie
    await set(buzzerRef, {
      playerName,
      timestamp: serverTimestamp()
    })
    
    console.log(`🔔 ${playerName} a appuyé en premier !`)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur buzzer:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur buzzer'
    }
  }
}

export const resetBuzzer = async (code: string): Promise<ServiceResult> => {
  try {
    const buzzerRef = ref(database, `sessions/${code}/buzzerPressed`)
    const startTimeRef = ref(database, `sessions/${code}/buzzerStartTime`)
    
    // Réinitialiser uniquement les champs du buzzer
    await set(buzzerRef, null)
    await set(startTimeRef, serverTimestamp())
    
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
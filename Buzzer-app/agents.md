# Agent Guidelines - Projet Buzzer Multi-Joueurs

## Vue d'Ensemble du Projet

Application de buzzer en temps réel permettant à plusieurs joueurs sur mobile de s'affronter. Le premier à appuyer sur son buzzer est identifié visuellement par un changement de couleur.

## Architecture Technique

### Stack
- **Frontend**: React (TypeScript) avec Vite
- **Backend (cible)**: Node.js + Express + Socket.io
- **Déploiement (cible)**: PWA pour l'expérience mobile
- **État (cible)**: Zustand ou Context API avec synchronisation WebSocket

### Structure des Dossiers
```
buzzer-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Gestion d'état
│   │   ├── services/      # WebSocket client
│   │   ├── types/         # Types TypeScript
│   │   └── utils/         # Fonctions utilitaires
│   └── public/            # Assets statiques
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── handlers/      # Socket.io event handlers
│   │   ├── models/        # Modèles de données
│   │   ├── services/      # Logique métier
│   │   └── utils/         # Utilitaires serveur
│   └── tests/             # Tests backend
└── shared/                # Code partagé (types, constantes)
```

## 🔐 Règles de Sécurité et Anti-Triche

### Validation Côté Serveur
- **CRITIQUE**: Le timestamp du buzzer DOIT être déterminé par le serveur, jamais par le client
- Tous les événements de buzzer doivent être validés côté serveur
- Le serveur maintient l'état autoritaire de la session

```typescript
// ❌ MAUVAIS - Ne jamais faire confiance au timestamp client
socket.on('buzzer-pressed', (data) => {
  if (data.timestamp < session.firstPress.timestamp) {
    session.firstPress = data; // VULNÉRABLE
  }
});

// ✅ BON - Le serveur génère le timestamp
socket.on('buzzer-pressed', (playerId) => {
  const timestamp = Date.now();
  if (!session.firstPress) {
    session.firstPress = { playerId, timestamp };
    io.to(session.id).emit('buzzer-result', session.firstPress);
  }
});
```

### Protection des Sessions
- Générer des codes de session aléatoires (6 caractères alphanumériques)
- Limiter le nombre de joueurs par session (ex: max 8)
- Implémenter un timeout de session (ex: 1h d'inactivité)
- Valider que le joueur appartient à la session avant chaque action

## ⚡ Performance Temps Réel

### WebSocket - Bonnes Pratiques

```typescript
// Connexion avec reconnexion automatique
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Gestion des états de connexion
socket.on('connect', () => {
  console.log('Connecté au serveur');
  // Rejoindre automatiquement la session si déconnexion
  if (currentSessionId) {
    socket.emit('rejoin-session', currentSessionId);
  }
});
```

### Optimisation du Rendu React
- Utiliser `React.memo()` pour les composants de buzzer
- Éviter les re-rendus inutiles avec `useMemo` et `useCallback`
- Débouncer les animations visuelles si nécessaire

```typescript
// Composant optimisé
const BuzzerButton = React.memo(({ 
  playerId, 
  isPressed, 
  onPress 
}: BuzzerProps) => {
  const handlePress = useCallback(() => {
    onPress(playerId);
  }, [playerId, onPress]);

  return (
    <button
      onClick={handlePress}
      className={`buzzer ${isPressed ? 'pressed' : ''}`}
      disabled={isPressed}
    >
      BUZZ!
    </button>
  );
});
```

## 🎨 Guidelines UX/UI

### États Visuels du Buzzer
1. **État Attente** (défaut)
   - Couleur neutre (gris ou bleu clair)
   - Animation subtile de "pulse" pour indiquer disponibilité
   - Texte: "Prêt à buzzer"

2. **État Pressé (Gagnant)**
   - Couleur vive spécifique au joueur
   - Animation d'expansion/flash
   - Texte: "Vous avez buzzé en premier!"
   - Feedback haptique si supporté

3. **État Pressé (Perdant)**
   - Couleur désaturée
   - Pas d'animation
   - Texte: "[Joueur X] a buzzé en premier"

4. **État Désactivé**
   - Buzzer grisé
   - Texte: "En attente de réinitialisation"

### Responsive Mobile
- Zone de touch minimum: 44x44px (recommandation Apple)
- Buzzer doit occuper 60-80% de l'écran en hauteur
- Feedback visuel instantané (<16ms)
- Support du mode paysage et portrait

## 🔄 Gestion d'État

### Store Zustand Recommandé

```typescript
interface BuzzerStore {
  sessionId: string | null;
  players: Player[];
  currentWinner: Player | null;
  buzzerState: 'idle' | 'pressed' | 'resetting';
  
  // Actions
  setSession: (id: string) => void;
  addPlayer: (player: Player) => void;
  setBuzzerPressed: (playerId: string) => void;
  resetBuzzer: () => void;
}

const useBuzzerStore = create<BuzzerStore>((set) => ({
  sessionId: null,
  players: [],
  currentWinner: null,
  buzzerState: 'idle',
  
  setSession: (id) => set({ sessionId: id }),
  addPlayer: (player) => set((state) => ({
    players: [...state.players, player]
  })),
  setBuzzerPressed: (playerId) => set((state) => ({
    currentWinner: state.players.find(p => p.id === playerId),
    buzzerState: 'pressed'
  })),
  resetBuzzer: () => set({
    currentWinner: null,
    buzzerState: 'idle'
  })
}));
```

## 🧪 Tests et Qualité

### Tests Prioritaires
1. **Tests d'intégration WebSocket**
   - Connexion/déconnexion
   - Détection du premier buzzer
   - Synchronisation multi-clients

2. **Tests de composants React**
   - Rendu des différents états du buzzer
   - Interactions utilisateur
   - Gestion des erreurs

3. **Tests de performance**
   - Latence de détection du buzzer (<100ms)
   - Charge serveur (simulation 100+ connexions)

### Outils
- **Vitest** pour les tests unitaires React
- **Playwright** pour les tests E2E
- **Socket.io-client** pour tester les WebSockets

## 📱 Progressive Web App (PWA)

### Manifest.json
```json
{
  "name": "Buzzer Game",
  "short_name": "Buzzer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
- Cache les assets statiques
- Gestion du mode offline (afficher message d'erreur)
- Ne PAS cacher les requêtes WebSocket

## 🚀 Déploiement

### Variables d'Environnement

```env
# Client
VITE_API_URL=https://api.buzzer-game.com
VITE_WS_URL=wss://api.buzzer-game.com

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://buzzer-game.com
SESSION_TIMEOUT=3600000
MAX_PLAYERS_PER_SESSION=8
```

### Checklist Pré-Déploiement
- [ ] Tests passent à 100%
- [ ] Build production sans warnings
- [ ] Variables d'environnement configurées
- [ ] HTTPS/WSS activé en production
- [ ] Compression gzip activée
- [ ] Logs structurés configurés
- [ ] Monitoring (Sentry ou équivalent) activé

## 🐛 Debugging

### Logs Structurés

```typescript
// Format de log recommandé
const logger = {
  info: (event: string, data: any) => {
    console.log(JSON.stringify({
      level: 'info',
      event,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (event: string, error: Error, data?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      event,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      ...data
    }));
  }
};

// Utilisation
socket.on('buzzer-pressed', (playerId) => {
  logger.info('buzzer_pressed', { 
    sessionId, 
    playerId, 
    timestamp: Date.now() 
  });
});
```

### Événements WebSocket à Logger
- Connexion/déconnexion joueur
- Création/suppression session
- Pression du buzzer (avec timestamp serveur)
- Réinitialisation du buzzer
- Erreurs de validation

## 📋 Checklist de Développement

Avant chaque feature:
- [ ] Les types TypeScript sont définis
- [ ] La validation côté serveur est implémentée
- [ ] Les tests sont écrits
- [ ] Le feedback visuel est clair
- [ ] La gestion d'erreur est en place
- [ ] Les logs sont ajoutés
- [ ] Le code est optimisé (pas de re-rendus inutiles)
- [ ] La documentation est à jour

## 🎯 Anti-Patterns à Éviter

### ❌ Ne JAMAIS faire
```typescript
// Faire confiance au client pour la logique métier
if (clientData.isWinner) { // DANGEREUX
  setWinner(clientData.playerId);
}

// Stocker des données sensibles côté client
localStorage.setItem('sessionSecret', secret); // VULNÉRABLE

// Oublier la gestion d'erreur WebSocket
socket.emit('action'); // Que se passe-t-il si déconnecté ?

// Re-rendre tout le DOM à chaque événement
const App = () => {
  const [state, setState] = useState(bigObject);
  // Re-render massif à chaque changement
};
```

### ✅ Faire à la place
```typescript
// Le serveur décide de la logique
socket.on('buzzer-pressed', (playerId) => {
  const isFirstPress = validateAndDeterminWinner(sessionId, playerId);
  if (isFirstPress) {
    io.to(sessionId).emit('winner', playerId);
  }
});

// Sécuriser les données sensibles
// Utiliser des tokens JWT côté serveur

// Toujours gérer les erreurs
try {
  socket.emit('action', data, (ack) => {
    if (ack.error) handleError(ack.error);
  });
} catch (error) {
  logger.error('socket_error', error);
}

// Optimiser les rendus
const OptimizedComponent = React.memo(({ specificProp }) => {
  // Ne re-render que si specificProp change
});
```

## 🔧 Configuration Recommandée

### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler"
  }
}
```

### Tailwind (tailwind.config.js)
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        buzzer: {
          idle: '#94a3b8',
          pressed: '#22c55e',
          lost: '#64748b'
        }
      }
    }
  }
}
```

---

**Version**: 1.0.0  
**Dernière mise à jour**: Décembre 2024  
**Mainteneur**: Votre équipe
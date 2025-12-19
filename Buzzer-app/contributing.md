# Guide de Contribution - Projet Buzzer

## 📋 Table des Matières
- [Workflow Git](#workflow-git)
- [Convention de Commits](#convention-de-commits)
- [Branches](#branches)
- [Pull Requests](#pull-requests)
- [Hooks Git Automatiques](#hooks-git-automatiques)
- [Scripts de Vérification](#scripts-de-vérification)
- [Code Review](#code-review)

## 🌿 Workflow Git

### Configuration Initiale

```bash
# Cloner le repository
git clone https://github.com/CAbdu/Buzzer-app.git
cd Buzzer-app

# Installer les dépendances (installe aussi Husky)
npm install

# Créer votre branche de travail
git checkout -b feature/nom-de-votre-feature
```

### Workflow Quotidien

```bash
# 1. Mettre à jour main avant de commencer
git checkout main
git pull origin main

# 2. Créer/passer sur votre branche
git checkout -b feature/ma-nouvelle-feature

# 3. Travailler sur votre code
# ... faire vos modifications ...

# 4. Vérifier vos changements
git status
git diff

# 5. Ajouter vos fichiers (éviter "git add .")
git add src/components/Buzzer.tsx
git add src/services/socket.ts

# 6. Commit (les hooks se déclenchent automatiquement)
git commit -m "feat(buzzer): add visual feedback on press"

# 7. Pousser votre branche
git push origin feature/ma-nouvelle-feature
```

## 📝 Convention de Commits

Nous utilisons **Conventional Commits** pour des commits clairs et automatisables.

### Format

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types de Commits

| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat(buzzer): add color customization` |
| `fix` | Correction de bug | `fix(websocket): handle reconnection properly` |
| `docs` | Documentation uniquement | `docs(readme): update installation steps` |
| `style` | Formatage, point-virgules manquants, etc. | `style(button): fix indentation` |
| `refactor` | Refactorisation du code | `refactor(store): simplify state management` |
| `perf` | Amélioration de performance | `perf(socket): reduce emit frequency` |
| `test` | Ajout ou modification de tests | `test(buzzer): add unit tests for button` |
| `chore` | Tâches de maintenance | `chore(deps): update dependencies` |
| `ci` | Changements CI/CD | `ci(github): add workflow for tests` |

### Scopes Recommandés

- `buzzer` - Composant buzzer principal
- `session` - Gestion des sessions
- `websocket` - Communication temps réel
- `ui` - Interface utilisateur générale
- `server` - Code backend
- `store` - Gestion d'état
- `pwa` - Progressive Web App
- `config` - Fichiers de configuration

### Exemples de Bons Commits

```bash
# ✅ Bonne description, scope clair
git commit -m "feat(session): add 6-digit code generation"

# ✅ Avec corps détaillé
git commit -m "fix(websocket): prevent duplicate buzzer events

The server now tracks buzzer state per session to ignore
duplicate events from the same player within 100ms.

Closes #42"

# ✅ Breaking change
git commit -m "feat(api): change session creation endpoint

BREAKING CHANGE: POST /session now requires authentication
Migration guide in docs/migration.md"

# ❌ Mauvais commits
git commit -m "fix stuff"
git commit -m "wip"
git commit -m "updates"
git commit -m "more changes to the buzzer thing"
```

### Règles de Description

- Utiliser l'impératif présent: "add" pas "added" ou "adds"
- Pas de majuscule au début
- Pas de point à la fin
- Maximum 72 caractères
- Décrire **ce que fait** le commit, pas **comment**

```bash
# ✅ BON
git commit -m "feat(buzzer): add haptic feedback on press"

# ❌ MAUVAIS
git commit -m "feat(buzzer): Added a new feature that uses the Vibration API to make the phone vibrate when user presses."
```

## 🌳 Branches

### Branches Principales

- `main` - Code de production, toujours stable
- `develop` - Intégration des features (optionnel pour petits projets)

### Branches de Travail

#### Convention de Nommage

```
<type>/<description-courte>
```

**Types de branches:**
- `feature/` - Nouvelles fonctionnalités
- `fix/` - Corrections de bugs
- `refactor/` - Refactorisation
- `docs/` - Documentation
- `test/` - Tests
- `chore/` - Maintenance

**Exemples:**
```bash
feature/player-colors
fix/websocket-reconnection
refactor/buzzer-component
docs/api-documentation
test/integration-tests
chore/update-dependencies
```

### Règles de Branches

1. **Toujours** partir de `main` à jour
2. **Une branche = une feature/fix** (pas de scope creep)
3. **Supprimer** la branche après merge
4. **Pas de commit direct** sur `main`
5. **Rebaser régulièrement** sur `main` pour rester à jour

```bash
# Mettre à jour votre branche avec les derniers changements de main
git checkout feature/ma-feature
git fetch origin
git rebase origin/main

# En cas de conflits
# 1. Résoudre les conflits dans les fichiers
# 2. git add <fichiers-résolus>
# 3. git rebase --continue
```

## 🔀 Pull Requests

### Avant de Créer une PR

```bash
# Checklist pré-PR
✓ Tous les tests passent localement
✓ Le code est linté (pas d'erreurs ESLint)
✓ Le code est formaté (Prettier)
✓ La documentation est à jour
✓ Les commits suivent la convention
✓ La branche est à jour avec main
```

### Template de PR

```markdown
## 🎯 Description

Brève description de ce que fait cette PR.

## 🔗 Issue Liée

Closes #123

## 🧪 Type de Changement

- [ ] 🐛 Bug fix (non-breaking change)
- [ ] ✨ New feature (non-breaking change)
- [ ] 💥 Breaking change (fix or feature that breaks existing functionality)
- [ ] 📝 Documentation update

## 🧪 Tests

- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration ajoutés/mis à jour
- [ ] Tests manuels effectués

## 📸 Captures d'écran (si applicable)

[Ajouter des captures d'écran pour les changements UI]

## ✅ Checklist

- [ ] Mon code suit les conventions du projet
- [ ] J'ai commenté le code dans les zones difficiles à comprendre
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que mon fix/feature fonctionne
- [ ] Les tests unitaires passent localement
- [ ] Les commits suivent Conventional Commits
```

### Processus de Review

1. **Créer la PR** sur GitHub
2. **Assigner des reviewers** (au moins 1)
3. **Répondre aux commentaires** dans les 24h
4. **Faire les modifications** demandées
5. **Re-request review** après changements
6. **Merge** après approbation

### Règles de Merge

- ✅ **Squash and merge** recommandé (commits propres dans main)
- ✅ Au moins **1 approbation** requise
- ✅ Tous les **tests CI/CD** doivent passer
- ✅ Pas de **conflits** avec main
- ❌ Pas de **force push** sur les branches partagées

## 🪝 Hooks Git Automatiques

Nous utilisons **Husky** et **lint-staged** pour automatiser les vérifications.

### Installation

```bash
# Installation automatique avec npm install
npm install

# Si besoin de réinstaller Husky
npm run prepare
```

### Hooks Configurés

#### Pre-commit (avant chaque commit)

```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lance lint-staged
npx lint-staged
```

#### Commit-msg (validation du message)

```json
// .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Valide le format Conventional Commits
npx --no -- commitlint --edit $1
```

#### Pre-push (avant chaque push)

```json
// .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lance les tests
npm run test

# Lance le build
npm run build
```

### Configuration lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

### Contourner les Hooks (Urgence Uniquement)

```bash
# ⚠️ À utiliser EXCEPTIONNELLEMENT
git commit --no-verify -m "hotfix: critical production bug"
git push --no-verify
```

## 🛠️ Scripts de Vérification

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run test && npm run build",
    "prepare": "husky install"
  }
}
```

### Commandes Utiles

```bash
# Vérifier tout avant de pousser
npm run validate

# Corriger automatiquement le formatage
npm run format

# Corriger les problèmes ESLint
npm run lint:fix

# Vérifier les types TypeScript
npm run type-check

# Lancer les tests en mode watch
npm run test

# Voir la couverture des tests
npm run test:coverage
```

## 👀 Code Review

### Pour les Reviewers

#### Checklist de Review

**Fonctionnalité:**
- [ ] La feature fait ce qui est décrit dans la PR
- [ ] Pas de régression introduite
- [ ] Gère les cas d'erreur correctement

**Code Quality:**
- [ ] Le code est lisible et maintenable
- [ ] Pas de duplication de code
- [ ] Les noms de variables/fonctions sont clairs
- [ ] Pas de console.log oubliés
- [ ] Pas de code commenté inutile

**Performance:**
- [ ] Pas de re-renders inutiles (React)
- [ ] Optimisations WebSocket (éviter les emit en boucle)
- [ ] Pas de memory leaks

**Sécurité:**
- [ ] Validation côté serveur présente
- [ ] Pas de données sensibles exposées
- [ ] Protection contre XSS/injection

**Tests:**
- [ ] Tests présents et pertinents
- [ ] Couverture suffisante (>80%)
- [ ] Tests passent en local

#### Comment Reviewer

```markdown
# 💬 Suggestions
Préfixer avec emoji pour clarté:
- 🔴 Bloquant (must fix)
- 🟡 Suggestion (nice to have)
- 💡 Idée (à discuter)
- ❓ Question

# Exemples de commentaires constructifs

🔴 **Bloquant**: Cette fonction ne gère pas le cas où `playerId` est `null`.
Suggestion: Ajouter une vérification `if (!playerId) return;`

🟡 **Suggestion**: On pourrait extraire cette logique dans un custom hook `useBuzzerPress()` pour la réutilisabilité.

💡 **Idée**: As-tu considéré utiliser `useReducer` ici au lieu de `useState` multiples ? Ça simplifierait la logique.

❓ **Question**: Pourquoi utiliser `setTimeout` ici plutôt qu'un debounce de lodash ?
```

### Pour les Contributeurs

#### Répondre aux Reviews

```markdown
# ✅ Accepter et implémenter
"Bonne remarque ! J'ai ajouté la vérification dans [commit abc123]"

# 💬 Discuter
"Je comprends ton point. J'ai choisi setTimeout pour éviter une dépendance. 
Penses-tu que c'est vraiment nécessaire dans ce cas ?"

# ❌ Désaccord constructif
"Je ne suis pas sûr que ce soit un problème ici car [raison].
Peut-on en discuter en vocal ?"
```

#### Demander de l'Aide

```markdown
# Dans la PR ou en commentaire
"@reviewer J'ai du mal à implémenter ta suggestion sur le debouncing.
Pourrais-tu me montrer un exemple ou en discuter rapidement ?"
```

## 🚦 CI/CD (GitHub Actions)

### Workflow Automatique

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Badges à Ajouter au README

```markdown
![CI](https://github.com/votre-org/buzzer-app/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/votre-org/buzzer-app/branch/main/graph/badge.svg)
```

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)
- [Husky Documentation](https://typicode.github.io/husky/)

## 🆘 Problèmes Courants

### Hooks Husky ne se déclenchent pas

```bash
# Réinstaller Husky
rm -rf .husky
npm run prepare
chmod +x .husky/*
```

### Commitlint échoue

```bash
# Vérifier le format de votre commit
npx commitlint --edit <commit-message>

# Amender le dernier commit
git commit --amend -m "feat(scope): correct message"
```

### Tests échouent en CI mais passent en local

```bash
# Reproduire l'environnement CI
rm -rf node_modules
npm ci
npm run test
```

---

**Questions ?** Ouvrez une issue ou contactez l'équipe sur Slack #buzzer-dev
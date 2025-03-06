# ChezFlora - Application Web de Fleuristerie

Une application web complète pour la gestion d'une entreprise de fleuristerie, y compris la vente en ligne, les services de décoration et la gestion de contenu.

## Structure du projet

- `backend/` - API REST avec Node.js et Express
- `frontend/` - Interface client avec React
- `admin-dashboard/` - Interface d'administration avec React
- `docs/` - Documentation technique
- `scripts/` - Scripts utilitaires

## Configuration requise

- Node.js (v14+)
- MySQL (v8+)
- npm ou yarn

## Installation

1. Clonez ce repository
2. Installez les dépendances :
    cd backend && npm install
    cd ../frontend && npm install
    cd ../admin-dashboard && npm install
3. Configurez les variables d'environnement dans les fichiers `.env`
4. Créez la base de données MySQL
5. Exécutez les migrations : `cd backend && npx sequelize-cli db:migrate`
6. Exécutez les seeders : `cd backend && npx sequelize-cli db:seed:all`

## Démarrage

- Backend : `cd backend && npm run dev`
- Frontend : `cd frontend && npm start`
- Admin Dashboard : `cd admin-dashboard && npm start`

## Licence

[MIT](LICENSE)
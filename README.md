# WeddMate 💍

Plateforme mobile de coordination de mariage — iOS & Android.

## Structure

```
weddmate/
├── mobile/     → React Native + Expo
└── backend/    → Node.js + Express + Prisma
```

## Démarrage rapide

```bash
# Backend
cd backend && npm install && npx prisma migrate dev && npm run dev

# Mobile
cd mobile && npm install && npx expo start
```
# Générer le code JWT

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Million Catcher

Joc de trivia en temps real amb apostes, basat en Socket.IO + Express + React + PostgreSQL.

## 🚀 Deploy a Railway

### Variables d'entorn necessàries

```
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### Passos

1. Crea un nou projecte a [Railway](https://railway.app)
2. Afegeix un plugin de **PostgreSQL** al projecte
3. Fes push d'aquest repositori o connecta'l des de GitHub
4. Railway detectarà automàticament el `railway.json` i executarà:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
5. Afegeix la variable `DATABASE_URL` (Railway la genera automàticament si uses el plugin de PostgreSQL)
6. Executa les migracions: `npm run db:push`

## 🛠️ Desenvolupament local

```bash
npm install
DATABASE_URL=postgresql://... npm run dev
```

## 📁 Estructura

```
├── client/          # Frontend React (TSX)
├── server/          # Backend Express (JS)
│   ├── index.js
│   ├── routes.js    # Socket.IO events
│   ├── storage.js   # DB queries
│   ├── db.js        # Drizzle ORM setup
│   └── static.js    # Servir fitxers estàtics
├── shared/
│   └── schema.js    # Taules Drizzle ORM
├── vite.config.js
├── drizzle.config.js
└── railway.json
```

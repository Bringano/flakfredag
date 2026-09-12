# 🍺 Ölprovning – Adam, Emil & Victor

En liten webbapp för att registrera och ranka öl ni provat tillsammans:
mat, betyg 1–10 (med decimaler) från Adam, Emil och Victor, topplista, historik och personstatistik.

## Stack
- **Frontend**: React + TypeScript + Vite + Tailwind + Recharts
- **Backend**: Node.js + Express + TypeScript
- **Databas**: PostgreSQL
- **Deploy**: Docker (en container), tänkt för Render.com

---

## 1. Köra lokalt (med Docker Compose)

Kräver bara Docker installerat.

```bash
docker compose up --build
```

Appen (frontend + API) körs sedan på **http://localhost:3000**
Postgres körs i en egen container och data sparas i en Docker-volym (`pgdata`), så den finns kvar mellan omstarter.

Vill du köra frontend och backend separat under utveckling (med hot reload):

```bash
# Terminal 1 – databasen
docker compose up db

# Terminal 2 – backend
cd server
cp .env.example .env   # peka DATABASE_URL mot localhost:5432
npm install
npm run dev

# Terminal 3 – frontend (Vite dev-server, proxar /api mot backend)
cd client
npm install
npm run dev
```

---

## 2. Deploy till Render.com (gratis)

Render kan läsa `render.yaml` i repot ("Blueprint") och skapar automatiskt:
- en **Web Service** (bygger och kör din Dockerfile)
- en **PostgreSQL-databas** (gratisnivå)
- kopplar ihop dem via miljövariabeln `DATABASE_URL` automatiskt

### Steg för steg
1. Skapa ett nytt repo på GitHub och pusha upp den här mappen.
2. Gå till [render.com](https://render.com) → skapa konto (gratis, ingen kortuppgift krävs för free-nivån).
3. Klicka **New +** → **Blueprint**.
4. Välj ditt GitHub-repo. Render hittar `render.yaml` automatiskt och visar vad som kommer skapas (1 web service + 1 databas).
5. Klicka **Apply**. Första bygget tar några minuter (bygger Docker-imagen).
6. När den är klar får du en gratis URL, typ `https://olprovning.onrender.com` – den fungerar direkt och kan delas med Adam, Emil och Victor.

### Egen domän (valfritt)
Under Web Service → **Settings** → **Custom Domains** kan ni lägga in en egen domän ni äger och peka DNS dit enligt Renders instruktioner. Helt gratis, ni betalar bara för själva domänregistreringen om ni vill ha en.

> **Obs (gratisnivå på Render):** en gratis Web Service "somnar" efter ~15 min utan trafik och tar 30–60 sek att vakna vid nästa besök. Den gratis databasen raderas efter 90 dagars inaktivitet om du inte uppgraderar – helt okej för ett kul sidoprojekt, men värt att veta.

---

## 3. Struktur

```
beer-rating-app/
├── Dockerfile           # bygger både frontend & backend till en image
├── docker-compose.yml   # lokal utveckling (app + Postgres)
├── render.yaml          # Render.com blueprint (web service + databas)
├── server/              # Express + TypeScript API
│   └── src/
│       ├── db.ts        # Postgres-anslutning
│       ├── init.sql     # skapar tabeller (körs automatiskt vid start)
│       ├── index.ts     # server entry point
│       └── routes/
│           ├── beers.ts
│           ├── tastings.ts
│           └── stats.ts
└── client/               # React + Vite + Tailwind
    └── src/
        ├── App.tsx
        ├── api.ts
        ├── types.ts
        └── components/
            ├── Nav.tsx
            ├── Leaderboard.tsx
            ├── History.tsx
            ├── PersonStats.tsx
            └── NewTastingForm.tsx
```

## 4. Funktioner
- **Topplista** – alla öl rankade efter snittbetyg
- **Historik** – varje provningstillfälle: öl, mat, vad Adam/Emil/Victor röstade, och snitt
- **Personstatistik** – vem av de tre har högst snittscore på betygen de gett
- **Ny provning** – välj en öl ni redan lagt in (eller lägg till en ny), registrera vilken mat ni åt, och betygsätt 1–10 med decimaler för alla tre personer i samma formulär

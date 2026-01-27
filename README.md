# DietistApp

En komplett webbaserad applikation för kostregistrering och näringsberäkning baserad på Livsmedelsverkets LivsmedelData API.

## Översikt

DietistApp är en fullstack TypeScript-applikation som möjliggör:
- Kostregistrering per dag med näringsberäkning
- Uppföljning av klienter för dietister
- Recepthantering med ingredienser
- Integration med Livsmedelsverkets öppna API
- Robust caching för offline-tolerans

## Teknisk Stack

### Backend
- **Framework**: NestJS
- **Språk**: TypeScript
- **Databas**: PostgreSQL (primär), SQLite (dev/on-prem)
- **ORM**: TypeORM
- **Autentisering**: JWT med refresh tokens
- **Lösenordshantering**: Argon2

### Frontend
- **Framework**: React 18
- **Språk**: TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP**: Axios

### Deployment
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **Reverse Proxy**: Nginx

## Projektstruktur

```
dietistapp/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/     # Autentisering
│   │   │   ├── foods/    # Livsmedelsverket integration
│   │   │   ├── entries/  # Kostregistrering
│   │   │   ├── recipes/  # Recepthantering
│   │   │   ├── database/ # TypeORM entities
│   │   │   └── common/   # Guards, decorators, etc.
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── web/              # React frontend
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── store/
│       │   └── hooks/
│       ├── Dockerfile
│       └── .env.example
├── packages/
│   └── shared/           # Delade typer och utilities
│       └── src/
│           ├── types/    # TypeScript types
│           ├── models/   # Domain models
│           ├── dto/      # DTOs med Zod validation
│           └── utils/    # Hjälpfunktioner
├── infra/
│   ├── docker/           # Docker Compose
│   │   └── docker-compose.yml
│   ├── k8s/              # Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── postgres.yaml
│   │   ├── api.yaml
│   │   ├── web.yaml
│   │   └── README.md
│   └── scripts/          # Hjälpscripts
└── package.json          # Root workspace config
```

## Kom Igång

### Förutsättningar

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (för lokal utveckling)
- Docker och Docker Compose (för containerized deployment)

### Lokal Utveckling

#### 1. Klona och installera beroenden

```bash
git clone https://github.com/MrOfBrightside/DietistApp.git
cd DietistApp
npm install
```

#### 2. Konfigurera miljövariabler

Backend:
```bash
cd apps/api
cp .env.example .env
# Redigera .env med dina inställningar
```

Frontend:
```bash
cd apps/web
cp .env.example .env
# Redigera .env med API URL
```

#### 3. Starta PostgreSQL

Med Docker:
```bash
docker run -d \
  --name dietistapp-postgres \
  -e POSTGRES_USER=dietistapp \
  -e POSTGRES_PASSWORD=dietistapp_password \
  -e POSTGRES_DB=dietistapp_db \
  -p 5432:5432 \
  postgres:16-alpine
```

Eller använd din lokala PostgreSQL installation.

#### 4. Bygg shared package

```bash
cd packages/shared
npm run build
```

#### 5. Starta backend

```bash
cd apps/api
npm run dev
```

Backend körs på http://localhost:3000

#### 6. Starta frontend (i nytt terminal)

```bash
cd apps/web
npm run dev
```

Frontend körs på http://localhost:5173

### Snabbstart med Docker Compose

```bash
cd infra/docker
docker-compose up -d
```

Detta startar:
- PostgreSQL på port 5432
- API på http://localhost:3000
- Web på http://localhost:80

## API Dokumentation

### Autentisering

#### POST /api/auth/register
Registrera ny användare

```json
{
  "email": "user@example.com",
  "password": "minst8tecken",
  "role": "CLIENT" | "DIETITIAN" | "ADMIN"
}
```

#### POST /api/auth/login
Logga in

```json
{
  "email": "user@example.com",
  "password": "lösenord"
}
```

#### POST /api/auth/refresh
Förnya access token

```json
{
  "refreshToken": "din-refresh-token"
}
```

### Livsmedel

#### GET /api/foods/search?q=mjölk
Sök livsmedel

#### GET /api/foods/:foodNumber
Hämta livsmedel per nummer

#### GET /api/foods/:foodNumber/nutrients
Hämta näringsvärden

### Entries

#### GET /api/clients/:clientId/entries?from=2024-01-01&to=2024-01-31
Hämta registreringar

#### POST /api/clients/:clientId/entries
Skapa ny registrering

```json
{
  "date": "2024-01-20",
  "mealType": "BREAKFAST",
  "entryType": "FOOD",
  "foodNumber": "1001",
  "foodNameSnapshot": "Mjölk, standardmjölk",
  "grams": 200,
  "time": "08:00",
  "comment": "Frukost"
}
```

#### PUT /api/entries/:entryId
Uppdatera registrering

#### DELETE /api/clients/:clientId/entries/:entryId
Ta bort registrering

#### GET /api/clients/:clientId/summary/day?date=2024-01-20
Hämta dagssummering med näringsberäkningar

#### GET /api/clients/:clientId/summary/range?from=2024-01-01&to=2024-01-31
Hämta periodssummering

### Recept

#### GET /api/recipes
Hämta användarens recept

#### POST /api/recipes
Skapa nytt recept

```json
{
  "name": "Smoothie",
  "servings": 2,
  "description": "Grön smoothie",
  "items": [
    {
      "foodNumber": "1001",
      "foodNameSnapshot": "Mjölk",
      "grams": 200
    },
    {
      "foodNumber": "1234",
      "foodNameSnapshot": "Banan",
      "grams": 100
    }
  ]
}
```

#### GET /api/recipes/:id
Hämta recept

#### PUT /api/recipes/:id
Uppdatera recept

#### DELETE /api/recipes/:id
Ta bort recept

### Health Checks

#### GET /health
Hälsostatus

#### GET /ready
Readiness check

## Beräkningslogik

### Näringsberäkning

Livsmedelsverkets näringsvärden är per 100g. Beräkningen:

```typescript
intake = (grams / 100) * valuePer100g
```

För recept:
1. Beräkna total näring för alla ingredienser
2. Summera
3. Dela på antal portioner för per-portion värde

### Summering

Summering sker på:
- **Rad-nivå**: Enskild entry eller receptingrediens
- **Måltid-nivå**: Frukost, Lunch, Middag, Mellanmål
- **Dag-nivå**: Alla måltider för en dag
- **Period-nivå**: Alla dagar i ett intervall

## Caching och Offline-Tolerans

### Read-Through Cache

Alla anrop till Livsmedelsverket API cachas i databasen:
- **FoodCache**: Grundinformation per livsmedelsnummer
- **NutrientCache**: Näringsvärden per livsmedelsnummer

### TTL och Stale Data

- Default TTL: 7 dagar (konfigurerbar via `CACHE_TTL_DAYS`)
- Om API är nere används gammal cache med varning i UI
- `apiVersion` och `fetchedAt` sparas för spårbarhet

### Retry Logic

Exponential backoff vid API-fel:
- 3 försök
- Väntetid: 2^n sekunder

## Säkerhet

### Autentisering
- JWT access token (15 min livstid)
- JWT refresh token (7 dagar livstid)
- Argon2 password hashing

### Auktorisering
- Rollbaserad åtkomstkontroll (RBAC)
- Guards på endpoint-nivå
- Klienter ser bara sina egna data
- Dietister ser bara sina klienters data

### GDPR
- Minimal persondata lagras
- Ingen loggning av matval på individnivå
- Namn på livsmedel sparas som snapshot (ej persondata)

## Deployment

### Docker Compose (On-Prem)

```bash
cd infra/docker
docker-compose up -d
```

### Kubernetes (Cloud)

Se [infra/k8s/README.md](./infra/k8s/README.md) för detaljerad guide.

Snabbstart:
```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/postgres.yaml
kubectl apply -f infra/k8s/api.yaml
kubectl apply -f infra/k8s/web.yaml
```

## Testning

### Backend

```bash
cd apps/api
npm test
```

### Frontend

```bash
cd apps/web
npm test
```

## Licens och Attribuering

### Data från Livsmedelsverket

Denna applikation använder data från [Livsmedelsverket](https://www.livsmedelsverket.se) via deras öppna API.

**Licens**: [Creative Commons Attribution 4.0 (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

Detta innebär att du är fri att:
- Dela och kopiera materialet
- Anpassa materialet

Under följande villkor:
- **Erkännande**: Du måste ge lämpligt erkännande, tillhandahålla en länk till licensen och ange om ändringar har gjorts

### Applikationslicens

DietistApp-applikationen: [Lägg till din licens här]

## Bidra

Pull requests är välkomna! För större ändringar, öppna först en issue för att diskutera vad du vill ändra.

## Support och Kontakt

- Issues: https://github.com/MrOfBrightside/DietistApp/issues
- Email: [Din email]

## Roadmap

### Framtida funktioner
- [ ] Export till PDF och CSV
- [ ] Portionsstöd med portionstabell
- [ ] Grafer och trender över tid
- [ ] Mål och rekommendationer per näringsämne
- [ ] Bilduppladdning för måltider
- [ ] Mobil app (React Native)
- [ ] Push-notiser för påminnelser
- [ ] Delning av recept mellan användare
- [ ] Bättre offline-stöd med Service Workers

## Tekniska Förbättringar
- [ ] End-to-end tester med Playwright
- [ ] CI/CD pipeline
- [ ] Monitoring med Prometheus + Grafana
- [ ] Rate limiting
- [ ] API versioning
- [ ] GraphQL support
- [ ] WebSocket för realtidsuppdateringar

---

**Data från Livsmedelsverket - Licens CC BY 4.0**

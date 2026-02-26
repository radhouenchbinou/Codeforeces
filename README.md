# VoiceFirst — Voice-First Dating App MVP

A dating app where emotional connection comes before appearance. Users connect through voice and text; photos are hidden until both parties mutually consent to reveal them.

## Philosophy

- Voice-first: hear someone before seeing them
- No swiping — calm, intentional discovery (5–7 profiles/day)
- Photo reveal only with mutual consent
- Targets France / EU users aged 18–40
- GDPR-compliant, EU-hosted

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL 15 |
| Cache / Queues | Redis 7 + BullMQ |
| Media Storage | Cloudinary (EU region) |
| Chat | Stream Chat |
| Voice Calls | Agora |
| Auth | JWT (access 15min, refresh 30d) |
| Hosting | EU-only servers |

## Project Structure

```
├── backend/       NestJS API
├── mobile/        React Native + Expo app
├── docker-compose.yml
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker + Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
npm install
npm run migration:run
npm run start:dev
```

API runs at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api/docs`

### 3. Mobile

```bash
cd mobile
cp .env.example .env
# Fill in EXPO_PUBLIC_* variables
npm install
npx expo start
```

## Core Features

1. **Auth** — Email/password, optional phone verification, JWT, GDPR consent gate
2. **Profiles** — Age, location, gender, dating intent, bio, voice intro (optional)
3. **Photo System** — Photos hidden by default; backend-controlled access via signed URLs
4. **Photo Verification** — Liveness check (selfie vs uploaded photo)
5. **Discovery** — 5–7 text-only profile cards per day with voice intros
6. **Matching** — Mutual "Interested" creates a match
7. **Chat** — Stream Chat for text + voice messages
8. **Voice Calls** — Agora; unlocks after N messages exchanged
9. **Photo Reveal** — Both must consent; one cancellation ends the match
10. **Visibility Score** — Internal score affecting discovery ranking (not shown to users)
11. **Safety** — Report, block, cancel match, admin moderation
12. **GDPR** — Right to delete, data export, EU storage

## Ranking Formula

```
FinalRank = (0.6 × CompatibilityScore) + (0.4 × VisibilityScore)
```

- **CompatibilityScore**: dating intent, age proximity, distance
- **VisibilityScore**: profile completeness, verification, behavior

## Environment Variables

See `backend/.env.example` and `mobile/.env.example` for required configuration.

## License

Private — All rights reserved.

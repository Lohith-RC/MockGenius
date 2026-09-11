# InterviewAI

[![CI Pipeline](https://github.com/yourusername/interviewAI/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/interviewAI/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![Vitest](https://img.shields.io/badge/Vitest-Tests%20Passing-emerald.svg)
![Security](https://img.shields.io/badge/Security-OWASP%20Hardened-green.svg)

**Enterprise-Grade AI Placement & Mock Interview Platform** — Practice technical and behavioral interviews with real-time SSE feedback, Monaco Code Lab algorithmic reviews, ATS resume analysis with JD matching, and automated quality gates.

---

## 🚀 Overview
InterviewAI provides a web interface where users can:
- Select interview topics and difficulty levels.
- Generate mock interview questions using Gemini AI.
- Record spoken answers and receive instant AI feedback on content, tone, and structure.
- Review past sessions stored in a lightweight JSON store.

The project showcases a full‑stack TypeScript application with a modern UI, server‑side routing, and a simple JSON‑based persistence layer.

---

## ✨ Features
- **Dynamic question generation** powered by Gemini AI.
- **Audio capture and transcription** for realistic interview practice.
- **Instant feedback** with suggestions for improvement.
- **Admin dashboard** to manage stored interview sessions.
- **Responsive UI** built with React and TypeScript.
- **Local JSON store** (`src/db/jsonStore.ts`) for easy data handling.

---

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite (or Next.js if extended)
- **Backend:** Node.js, Express (see `server.ts`)
- **AI Integration:** Gemini API (`GEMINI_API_KEY`)
- **Styling:** CSS Modules / Tailwind (customizable)
- **Data storage:** Local JSON files via `jsonStore.ts`

---

## 📦 Getting Started
### Prerequisites
- **Node.js** (v20 or later)
- **Git** (optional, for version control)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/interviewAI.git
cd interviewAI

# Install dependencies
npm install
```

### Configuration
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values in `.env`:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
   - `APP_URL`: Your application URL (e.g., http://localhost:3000)

### Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

### Production Build
```bash
# Build the application
npm run build

# Start the production server
npm start
```

---

## 📂 Project Structure
```
interviewAI/
├─ src/
│  ├─ components/        # UI components (Navbar, Sidebar, etc.)
│  ├─ db/jsonStore.ts    # Simple JSON persistence layer
│  ├─ pages/             # React page components
│  └─ App.tsx            # Root component
├─ server.ts             # Express server handling API routes
└─ README.md             # This file
```

---

## 🚀 Deployment

### Environment Variables for Production
Ensure these environment variables are set in your production environment:
- `NODE_ENV=production`
- `GEMINI_API_KEY`: Your Gemini API key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `APP_URL`: Your production URL (e.g., https://interviewai.yourdomain.com)
- `PORT`: Server port (default: 3000)

### Health Check
The application includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### Recommended Platforms
- **Render**: Easy deployment with automatic scaling
- **Railway**: Simple deployment with database options
- **Fly.io**: Global edge deployment

### Deployment Steps
1. Set up your hosting platform
2. Configure environment variables
3. Deploy the application
4. Verify the health check endpoint
5. Test OAuth callbacks with your production URL

---

## 🤝 Contributing
Feel free to submit issues or pull requests. Typical steps:
1. Fork the repo.
2. Create a feature branch.
3. Make your changes.
4. Run `npm test` (if tests are added) and ensure the app still builds.
5. Open a PR.

---

## 📄 License
This project is licensed under the MIT License – see the `LICENSE` file for details.

---

Enjoy practicing your interviews with InterviewAI!

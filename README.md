# 🔥 StreakKeeper - Full-Stack Habit Tracker

StreakKeeper is a modern, responsive full-stack habit tracking web application designed to help users build unstoppable daily momentum.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons
- **Backend**: Node.js (v22+ / v24+), Express.js, native `node:sqlite` SQLite database engine
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing (salt rounds: 10)
- **Testing**: Vitest for backend unit & integration tests, Playwright for end-to-end browser flows

---

## 🚀 Quick Start

### Prerequisites
- Node.js version 22 or 24 (or higher)
- npm version 9+

### 1. Install Dependencies
Run the install command across all workspace packages:
```bash
# In the project root:
npm run install:all
```
*(Alternatively: `npm install`, `cd server && npm install`, `cd ../client && npm install`)*

### 2. Run the Full Application (Dev Mode)
```bash
npm run dev
```
This starts both services concurrently:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 How Auth Tokens Are Handled

1. **Password Security**: Passwords must be at least 8 characters. Passwords are never stored in plaintext — they are hashed using `bcryptjs` with salt factor 10 before saving to SQLite.
2. **JWT Generation**: On successful signup or login (`/api/auth/signup`, `/api/auth/login`), the backend signs a JSON Web Token containing `{ id, email }` with a 7-day expiration (`JWT_EXPIRES_IN=7d`).
3. **Client Storage & Header Attachment**: The frontend stores the JWT in `localStorage` under `streakkeeper_token`. Every outgoing authenticated API request attaches the token in the standard HTTP header:
   ```http
   Authorization: Bearer <token>
   ```
4. **Session Hydration & Verification**: On page refresh, the frontend calls `GET /api/auth/me` with the stored token to verify session validity.
5. **Logout**: Logging out removes the token from `localStorage` and resets the client-side authentication state.

---

## 📈 Streak & Heatmap Rules

- **Current Streak**: The number of consecutive calendar days with a check-in ending on either **Today** or **Yesterday**.
  - If you check in today after yesterday's check-in, the streak increments.
  - If you haven't checked in today yet, your streak remains active based on yesterday's completion.
  - If neither today nor yesterday has a check-in, the streak resets to `0`.
- **30-Day Activity Heatmap**: Displays an interactive calendar grid representing the last 30 consecutive days up to today.

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests (Vitest)
```bash
npm run test
```
Tests cover:
- Pure streak calculation math across consecutive, broken, and backdated check-ins.
- User signup validation (email regex, password length, duplicate email prevention).
- Authentication, login failure cases, and session verification.
- Habit CRUD and daily check-ins.
- Strict cross-user isolation: User A cannot fetch, check-in to, or delete User B's habits.

### End-to-End Browser Tests (Playwright)
```bash
npm run test:e2e
```
Playwright verifies the complete end-to-end journey:
1. Signup with new credentials
2. Landing on protected Dashboard
3. Habit creation
4. Daily check-in (streak becomes 1 day)
5. Unchecking (streak updates to 0)
6. Logging out and logging back in with data persistence

---

## 📂 Project Structure

```
├── client/                     # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/         # Navbar, HabitCard, Heatmap, AddHabitModal, ProtectedRoute
│   │   ├── context/            # AuthContext (state & session hydration)
│   │   ├── pages/              # DashboardPage, LoginPage, SignupPage
│   │   ├── services/           # api.js fetch client
│   │   ├── App.jsx             # Main router & layout
│   │   ├── index.css           # Tailwind & glassmorphism theme
│   │   └── main.jsx
│   └── vite.config.js          # API proxy to localhost:5000
│
├── server/                     # Express + SQLite API backend
│   ├── src/
│   │   ├── db.js               # SQLite database setup & migrations
│   │   ├── middleware/auth.js  # JWT Bearer token authentication
│   │   ├── routes/             # auth.js & habits.js
│   │   ├── utils/streak.js     # Pure streak & heatmap logic
│   │   ├── app.js              # Express app configuration
│   │   └── index.js            # Server listener
│   └── tests/                  # Vitest unit & integration test suites
│
├── e2e/                        # Playwright end-to-end browser tests
│   └── streakkeeper.spec.js
├── streakkeeper.db             # Persistent SQLite database file
├── package.json                # Orchestration scripts (concurrently dev, test)
└── README.md
```

<div align="center">

# 🔥 StreakKeeper

**A modern, full-stack habit tracker designed to help you build unstoppable daily momentum.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-habittracker--7atdcg.fly.dev-FF5722?style=for-the-badge&logo=flydotio&logoColor=white)](https://habittracker-7atdcg.fly.dev)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Native_WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

🌐 **Live Deployment:** [https://habittracker-7atdcg.fly.dev](https://habittracker-7atdcg.fly.dev)

</div>

---

## ✨ Features

- ⚡ **Instant Habit Check-ins**: One-click completion toggling with zero latency and optimistic UI feedback.
- 🔥 **Intelligent Streak Engine**: Automated streak tracking with timezone-safe calculations, yesterday grace periods, and reset protection.
- 📊 **30-Day Activity Heatmaps**: Interactive GitHub-style visual heatmaps for every habit showing daily consistency.
- 📈 **Performance Dashboard**: Real-time stats including total habits, today's completion progress bar, active streaks count, and personal best records.
- 🛡️ **Secure JWT Authentication**: Stateless session authentication with `bcryptjs` salt hashing and strict cross-user tenant boundary enforcement.
- 💎 **Sleek Glassmorphism Design**: Tailored dark-mode UI with smooth micro-animations, glowing accent pills, and responsive layouts across mobile, tablet, and desktop.
- 🧪 **100% Tested**: Comprehensive test coverage across pure unit math (Vitest), integration endpoints (Supertest), and full browser journeys (Playwright).

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Core**: React 18 SPA built with Vite
- **Styling**: Tailwind CSS, custom glassmorphism effects, Lucide React icons
- **State & Routing**: React Context API (`AuthContext`), declarative protected routing, session hydration

### **Backend**
- **Runtime**: Node.js (v22+ / v24+) with native ES Modules
- **Framework**: Express.js REST API
- **Database**: Native `node:sqlite` (`DatabaseSync`) in Write-Ahead Logging (`WAL`) mode with foreign key cascade support
- **Auth & Crypto**: JSON Web Tokens (JWT) + `bcryptjs` (salt factor 10)

### **Testing & Automation**
- **Backend Tests**: Vitest (26 unit & integration tests)
- **E2E Browser Automation**: Playwright (multi-step lifecycle validation)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v22.x or v24.x (or higher)
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Micahtimmy/habittracker.git
cd habittracker
npm run install:all
```

### 2. (Optional) Seed Demo Data
Populate the database with a pre-configured demo user and active streaks:
```bash
node seed_demo.js
```
> **Demo Account Credentials:**
> - **Email**: `demo@streakkeeper.com`
> - **Password**: `Password123!`

### 3. Run Development Server
```bash
npm run dev
```
This concurrently boots:
- **Backend API**: `http://localhost:5000`
- **Frontend Client**: `http://localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 REST API Reference

All protected endpoints require `Authorization: Bearer <token>`.

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user (`email`, `password`) | ❌ |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | ❌ |
| `GET` | `/api/auth/me` | Hydrate user session from token | ✅ |

### **Habits & Tracking Endpoints**

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/habits?date=YYYY-MM-DD` | Fetch all user habits with streaks & 30-day heatmap | ✅ |
| `POST` | `/api/habits` | Create a new habit (`name`, `description`) | ✅ |
| `DELETE` | `/api/habits/:id` | Delete habit and cascade delete check-ins | ✅ |
| `POST` | `/api/habits/:id/checkin` | Check in habit for date (`{ date: "YYYY-MM-DD" }`) | ✅ |
| `DELETE` | `/api/habits/:id/checkin` | Remove check-in for date (`{ date: "YYYY-MM-DD" }`) | ✅ |

---

## 🗄️ Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Habits Table
CREATE TABLE habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Checkins Table
CREATE TABLE checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  checkin_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(habit_id, checkin_date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);
```

---

## 🧪 Testing

### Backend Unit & Integration Tests (Vitest)
```bash
npm run test
```
Tests cover:
- Mathematical edge cases in streak calculations (consecutive, broken, backdated check-ins).
- Auth payload validation (email format, min 8-char password, duplicate email rejection).
- Habit lifecycle and cascade deletions.
- Cross-user tenant boundary enforcement (User A cannot access or mutate User B's habits).

### End-to-End Browser Automation (Playwright)
```bash
# Run headless browser tests
npm run test:e2e

# Run with interactive UI debugger
npx playwright test --ui
```

---

## 📂 Project Structure

```text
habittracker/
├── client/                     # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/         # HabitCard, Heatmap, AddHabitModal, Navbar, ProtectedRoute
│   │   ├── context/            # AuthContext (state & session hydration)
│   │   ├── pages/              # DashboardPage, LoginPage, SignupPage
│   │   ├── services/           # api.js fetch client
│   │   ├── App.jsx             # Root router & layout
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
│   │   ├── app.js              # Express app setup
│   │   └── index.js            # Server listener
│   └── tests/                  # Vitest unit & integration test suites
│
├── e2e/                        # Playwright end-to-end browser tests
│   └── streakkeeper.spec.js
├── seed_demo.js                # Demo database seeder
├── playwright.config.js        # Playwright E2E configuration
├── package.json                # Project root orchestration scripts
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

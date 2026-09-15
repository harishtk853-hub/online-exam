# Online Examination Platform

A modern, high-performance, and secure Online Examination Platform engineered with React.js, Node.js, Express.js, and MySQL/MariaDB.

---

## 🏛️ Project Architecture

```text
React Frontend (Vite + Tailwind CSS + React Router)
       ↓  HTTP / REST API (JSON)
Node.js + Express.js Backend
       ↓  Parameterized SQL Queries / Connection Pool
MySQL / MariaDB Database
```

---

## 🔄 Architecture Migration Map (Legacy PHP/Laravel → Node.js/React)

| Domain Area | Legacy PHP/Laravel Implementation | Revised React + Node.js Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | Blade templates + Livewire components | React 18+ Single Page App (Vite, Tailwind CSS, Lucide icons) |
| **Client Routing** | Server-side Blade routing via `web.php` | Client-side React Router DOM v6 with route-guards |
| **API Layer** | Laravel Controllers & FormRequests | Modular Express Controllers & `express-validator` |
| **Authentication** | Laravel Fortify (Session-based) | JWT authentication with secure HTTP-only cookies / Bearer tokens |
| **Authorization** | Laravel Gate & Policy classes | Centralized Policy middleware with server-side enforcement |
| **Database Access** | Eloquent ORM & Laravel Migrations | `mysql2/promise` connection pool & versioned SQL migrations |
| **State Management** | Livewire wire:model & Session Flash | React Context (`AuthContext`, `ToastContext`) + Custom Hooks |

---

## 📁 Repository Structure

```text
online-examination/
│
├── client/                      # React Frontend (Vite)
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components (buttons, cards, forms)
│   │   ├── context/             # React context providers (AuthContext, ThemeContext)
│   │   ├── hooks/               # Custom React hooks (useAuth, useApi)
│   │   ├── layouts/             # Page layouts (MainLayout, AuthLayout, DashboardLayout)
│   │   ├── pages/               # Route views (Home, Login, Register, Profile, Groups, Schools)
│   │   ├── routes/              # Protected and public route configuration
│   │   ├── services/            # Axios API clients
│   │   ├── utils/               # Formatting, constants, and helper functions
│   │   ├── App.jsx              # Main App entry point
│   │   ├── main.jsx             # React DOM root
│   │   └── index.css            # Tailwind CSS directives & custom design system
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # DB connection pool & environment variables
│   │   ├── controllers/         # API Route Handlers (Auth, User, School, Group)
│   │   ├── middleware/          # Auth, Validation, Role Guard & Error Middleware
│   │   ├── models/              # Relational DB Models (User, School, Group, Member)
│   │   ├── policies/            # Business & Security authorization rules
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Core business logic
│   │   ├── utils/               # Response formatters, token generators, hashers
│   │   ├── validators/          # Express-validator schemas
│   │   └── app.js               # Express application configuration
│   ├── tests/                   # Jest / Supertest integration test suite
│   ├── package.json
│   └── server.js                # Server entry point
│
├── database/                    # Database Migrations & Seeders
│   ├── migrations/              # Relational SQL DDL migrations
│   └── seeders/                 # Default initial seed data
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL or MariaDB server

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure DB credentials in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 4. Running Tests
```bash
cd server
npm test
```

# SmartClass — Frontend

React 19 + Vite frontend for the SmartClass LMS.

**Stack:** React 19 · React Router v6 · Tailwind CSS · Recharts · Socket.IO Client · Lucide React

---

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

Requires the backend running at `http://localhost:5000` (proxied via Vite config).

---

## Project Structure

```
client/src/
├── pages/               # Route-level page components
│   ├── SignIn.jsx
│   ├── SignUp.jsx
│   ├── StudentDashboard.jsx
│   ├── TeacherDashboard.jsx
│   ├── CourseView.jsx       # Nested routes: /course/:id/:tab
│   ├── QuizView.jsx
│   ├── LiveClassRoom.jsx
│   ├── Features.jsx         # /features
│   ├── Pricing.jsx          # /pricing
│   ├── Security.jsx         # /security
│   ├── Enterprise.jsx       # /enterprise
│   ├── About.jsx            # /about
│   ├── Blog.jsx             # /blog
│   ├── Careers.jsx          # /careers
│   ├── Contact.jsx          # /contact
│   ├── Privacy.jsx          # /privacy
│   ├── Terms.jsx            # /terms
│   ├── Cookies.jsx          # /cookies
│   └── License.jsx          # /license
├── components/          # Reusable UI components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── CourseView/      # Tab components (Materials, Assignments, etc.)
│   ├── SignIn/
│   └── SignUp/
├── routes/
│   ├── PublicRoutes.jsx     # Unauthenticated routes
│   └── ProtectedRoutes.jsx  # Auth-gated routes
├── context/
│   ├── AuthContext.jsx      # JWT session, login/logout
│   └── ThemeContext.jsx     # Theme state (light/dark/cosmic)
└── theme/
    └── ThemeApplier.jsx
```

---

## Routing

### Public routes (unauthenticated)

| Path | Page |
|---|---|
| `/signin` | Sign in |
| `/signup` | Sign up |
| `/features` | Platform features |
| `/pricing` | Pricing plans |
| `/security` | Security overview |
| `/enterprise` | Enterprise solutions |
| `/about` | About SmartClass |
| `/blog` | Blog |
| `/careers` | Career openings |
| `/contact` | Contact form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/cookies` | Cookie policy |
| `/license` | License information |

### Protected routes (authenticated)

| Path | Page |
|---|---|
| `/` | Teacher Dashboard or Student Dashboard (role-based) |
| `/course/:id` | Redirects to `/course/:id/materials` |
| `/course/:id/:tab` | CourseView — tab is `materials`, `assignments`, `quizzes`, `live-classes`, or `students` |
| `/quiz/:id` | Quiz-taking interface |
| `/live-class/:id` | Live classroom |

All footer pages (`/features`, `/pricing`, etc.) are accessible from both authenticated and unauthenticated states.

---

## Themes

Three built-in themes switchable from the navbar:

| Theme | Description |
|---|---|
| `light` | Clean white with purple accent |
| `dark` | Deep dark with purple accent |
| `cosmic` | Dark with starfield aesthetic |

Theme is stored in `localStorage` under `smartclass_theme` and applied via CSS custom properties (`--bg`, `--text`, `--accent`, `--muted`, `--border`, etc.).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting without writing |

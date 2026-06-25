# 🧭 Class Compass

**Parul University timetable & daily class notifications.**

Class Compass is a free web app for Parul University students. Pick your class to instantly see its weekly timetable and get automatic daily push reminders for your lectures. Don't see your class? Drop your timetable **PDF** — it's read automatically (no AI, no manual typing) and saved for your whole division.

> Class Compass is a free, student-built tool and is **not** an official Parul University product.

---

## ✨ Features

- 🔍 **Searchable class picker** — type `AIML 15` and select your division.
- 📄 **PDF → timetable, automatically** — upload a timetable PDF and a deterministic parser turns it into structured data (days, slots, faculty, rooms, batches). No AI, no cost.
- 📝 **Review & edit** before saving — fix anything the parser missed.
- 🔔 **Daily push notifications** via Firebase Cloud Messaging (today's + tomorrow's schedule).
- ♻️ **Self-healing tokens** — stable per-device ID, token refresh on every open, and automatic pruning of expired tokens.
- 📊 **Attendance calculator** — see how many lectures you need to hit your target.
- ⚡ **Whole-division model** — one student uploads, the entire class is set.
- 🔎 **SEO + AEO ready** — metadata, JSON-LD (`WebApplication` + `FAQPage`), sitemap, robots, PWA manifest, `llms.txt`.

---

## 🏗 Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | react-icons, lucide-react |
| Database | MongoDB + Mongoose |
| PDF parsing | `pdfjs-dist` (pure JS, deployable) |
| Push | Firebase Cloud Messaging (web) + `firebase-admin` |
| Scheduling | `node-cron` / external cron |

---

## 🖥 Screens

| Route | Purpose |
|---|---|
| `/` | **Notifications** — search class, view weekly timetable, subscribe to reminders |
| `/upload` | **Upload** — drop a timetable PDF, review the parsed schedule, save |
| `/attandance` | **Attendance** — attendance percentage calculator |
| `/about` | **About & contact** — help, feedback, suggestions |

---

## 🔄 How it works

```
Upload PDF ─▶ /api/timetable/parse (pdfjs, no AI) ─▶ review & edit
          ─▶ /api/timetable/upload (upsert by division)
                                   │
Pick class ─▶ /api/timetable/get  ─┘─▶ render week + subscribe device
                                   │
Daily cron ─▶ /api/notification & /api/tomorrow ─▶ FCM push to the division
```

The PDF parser (`src/lib/pdfTimetable.ts`) extracts every text fragment with its `(x, y)` coordinates, rebuilds the day × time grid by clustering on those coordinates, then parses each cell string like `3AIML15:DSA:(DSA-F13):NB-410` into `{ subject, faculty, room, batch }`. The class identity (division, semester, academic year, program) is read from the PDF header.

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A MongoDB database (e.g. MongoDB Atlas)
- A Firebase project with Cloud Messaging enabled

### Install & run
```bash
git clone <your-repo-url>
cd project-noti
npm install
npm run dev          # http://localhost:3000
```

> Open the app at **`http://localhost:3000`** (not a LAN IP) — web push requires a secure origin (`localhost` or HTTPS).

---

## 🔐 Environment variables

Create `.env.local` in the project root:

```bash
# Database (use the standard mongodb:// form if SRV DNS fails locally)
MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/dbname

# Firebase Web (client) — from Project Settings → General
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...        # Cloud Messaging → Web Push certificates

# Firebase Admin (server) — from a service-account JSON
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Public site URL (canonical / sitemap / OG) — set to your deployed domain
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

> The Web config also has to be hard-coded in `public/firebase-messaging-sw.js` (a service worker can't read env vars).

---

## 📡 API reference

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/timetable/divisions` | List all classes that have a timetable |
| `GET` | `/api/timetable/get?division=` | Full timetable for a division |
| `GET` | `/api/timetable?division=&day=` | A single day's slots |
| `POST` | `/api/timetable/parse` | Parse an uploaded PDF (`multipart`, field `file`) → JSON |
| `POST` | `/api/timetable/upload` | Save/replace a division's timetable (upsert) |
| `POST` | `/api/register` | Register/refresh a device (`deviceId`, `fcmToken`, class) |
| `DELETE` | `/api/delete?userId=` | Unlink (delete) a device subscription |
| `POST` | `/api/notification?type=today` | Send today's schedule to all divisions |
| `POST` | `/api/tomorrow` | Send tomorrow's schedule to all divisions |

---

## 🔔 Notifications & scheduling

`/api/notification` and `/api/tomorrow` are **POST** endpoints meant to be triggered on a schedule:

```bash
curl -X POST https://your-domain.com/api/notification   # today's classes
curl -X POST https://your-domain.com/api/tomorrow        # tomorrow's classes
```

Wire them to a cron scheduler (e.g. a cron job, Render Cron, or `node-cron`). A typical setup:
- **08:00** → `/api/notification` (today's timetable)
- **20:00** → `/api/tomorrow` (tomorrow's timetable)

Tokens are kept healthy automatically: the client refreshes its FCM token on every open, and `sendFCM` deletes any token that comes back as unregistered/invalid.

---

## 🗄 Data models

**Timetable** (`models/Timetable.ts`) — one per division:
```ts
{
  branch, course, semester, academicYear,
  division,                 // unique, e.g. "3AIML15"
  schedule: [{ day, slots: [{ time, subject, faculty, room, batches[] }] }],
  source: "seed" | "upload",
  uploadedAt
}
```

**UserDevice** (`models/student.ts`) — one per browser/device:
```ts
{ branch, course, division, semester, academicYear, deviceId, fcmToken, expoToken }
```

---

## 📂 Project structure

```
src/
├── app/
│   ├── page.tsx                # Notifications screen
│   ├── upload/page.tsx         # Upload + review screen
│   ├── attandance/page.tsx     # Attendance calculator
│   ├── about/page.tsx          # About & contact
│   ├── layout.tsx              # Metadata + JSON-LD
│   ├── robots.ts / sitemap.ts / manifest.ts
│   └── api/
│       ├── timetable/{parse,upload,get,divisions,route}
│       ├── register, delete
│       └── notification, tomorrow
├── components/Navbar.tsx
├── lib/
│   ├── pdfTimetable.ts         # PDF → JSON parser
│   ├── timetable.ts            # shared types + normalize
│   ├── site.ts                 # SEO constants
│   ├── firebase.ts / firebaseAdmin.ts / getfcmtoken.ts
├── models/Timetable.ts, student.ts
├── service/fcmSender.ts, sendExpoPush.ts, notification.tsx
└── utils/db.ts
public/
├── firebase-messaging-sw.js    # FCM background handler
└── llms.txt                    # AEO descriptor
```

---

## 🚢 Deployment

- Works on any Node host (Render, Railway, a VM). `pdfjs-dist` is pure JS — no native binaries needed.
- Set all environment variables in the host's dashboard.
- Set `NEXT_PUBLIC_SITE_URL` to your real domain and submit `/sitemap.xml` to Google Search Console.
- Add a cron schedule that POSTs to `/api/notification` and `/api/tomorrow`.

```bash
npm run build
npm run start
```

---

## 👨‍💻 Author

**Priyanshu Joshi** — [joshipriyanshu575@gmail.com](mailto:joshipriyanshu575@gmail.com)

Built with Next.js, TypeScript & ❤️ for Parul University students.

# 📅 Smart Timetable Notification System

A Next.js + MongoDB powered academic timetable system that automatically sends daily class notifications to students at:

- 🕗 8:00 AM – Today's timetable
- 🌙 8:00 PM – Tomorrow's timetable

Students select their division inside the app and receive personalized notifications using Firebase Cloud Messaging (FCM).

---

## 🚀 Features

✅ Multi-division timetable support  
✅ Semester-based structure  
✅ Batch-wise practical handling  
✅ Automated daily notifications  
✅ MongoDB database integration  
✅ TypeScript support  
✅ Production-ready schema  
✅ Scalable architecture  
✅ Next.js App Router compatible  

---

## 🏗 Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** Next.js API Routes
- **Database:** MongoDB + Mongoose
- **Language:** TypeScript
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Scheduler:** Node Cron / Vercel Cron

---

## 📂 Project Structure


/app
/api
/seed-timetable
/timetable
/notifications

/models
Timetable.ts
User.ts

/lib
db.ts

/data
aimlData.ts


---

## 🗄 Database Schema

Each timetable document stores:

```ts
{
  branch: "CSE",
  course: "AIML",
  semester: 2,
  division: "2CSE AIML 1",
  academicYear: "2024-2025",
  schedule: [
    {
      day: "Monday",
      slots: [...]
    }
  ]
}

Supports:

Regular subjects

Batch-wise practical slots

Holidays

Library / Self Study

🔔 Notification Flow
8:00 PM

Server fetches tomorrow's timetable

Groups students by division

Sends FCM notification

8:00 AM

Server fetches today's timetable

Sends formatted schedule

🛠 Setup Instructions
1️⃣ Clone Repository
git clone <your-repo-url>
cd timetable-app
2️⃣ Install Dependencies
npm install
3️⃣ Setup Environment Variables

Create .env.local

MONGODB_URI=your_mongodb_connection_string
FCM_SERVER_KEY=your_firebase_key
4️⃣ Seed Timetable Data

Start server:

npm run dev

Open:

http://localhost:3000/api/seed-timetable

This will insert all Semester 2 AIML divisions.

📡 API Endpoints
Get Today’s Timetable
GET /api/timetable?division=2CSE AIML 5
Seed Timetable
GET /api/seed-timetable
🧠 How It Works

User selects branch, course, division

FCM token is stored in database

Cron job runs daily

Server queries timetable collection

Notification sent only to relevant division

📈 Future Improvements

Admin panel to edit timetable

Holiday override system

Exam schedule integration

Push notification customization

Attendance integration

Multi-semester support

Department-wide announcements

🛡 Production Notes

Remove seed route after initial setup

Use upsert instead of deleteMany in production

Use environment-specific cron scheduler

Enable MongoDB indexing on division + semester

👨‍💻 Author

Built with ❤️ using Next.js & TypeScript
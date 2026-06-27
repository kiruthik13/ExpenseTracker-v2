# ExpenseTracker v2.0 (MERN Premium Edition)

ExpenseTracker v2.0 is a modern, secure, and full-stack Personal Expense Tracker web application designed to help users log daily income and expenses, set monthly budgets, categorize transactions, upload receipts, analyze trends, and manage recurring plans.

Built using a service-repository-controller architecture on the backend, and a professional, responsive sage-white & forest-green Vanilla HTML5/CSS/JS layout on the frontend.

---

## 🚀 Core Features & Premium Modules

### 🎨 Design & Layout (Premium Sage-White UI)
- **Professional Light Theme:** Clean sage-white (`#F4F6F3`) page backgrounds with forest-green (`#1A4731`) accent branding. Zero dark backgrounds for premium readability.
- **Typographic Pairing:** DM Serif Display (headings, titles & greetings) + Inter (general UI controls).
- **Responsive Navigation Shell:** Slide-over sidebar for tablet and mobile screens, plus top navbar with search.

### 💎 Premium Analytical Engine
- **Financial Health Score:** A 0-100 real-time rating calculated dynamically based on user saving-to-spent ratios, budget limit compliance, and activity consistency.
- **AI spending Insights:** Automated rule-based recommendations highlighting high spending categories, spike increases, and low net balances.
- **Expense Prediction:** Project end-of-month totals based on historic daily averages.
- **Daily logging Streaks:** Gamified streak tracker that counts consecutive days of logging activity.
- **Achievements Badge Center:** Unlockable trophies (e.g. `First Step`, `Wealth Builder`, `Goal Getter`, `Loyal Logger`) visible in grayscale until unlocked.

### 🗓️ Advanced Planners & Reminders
- **Monthly Expense Calendar View:** Interactive grid highlighting daily spent and income sums. Click any date cell to show a list modal.
- **Savings Goal Tracker:** Define saving milestones with active progress bars, deadline counts, and deposit forms.
- **Subscriptions & Bills Pay:** Manage Netflix, Spotify, or utility invoices. Marking a bill as "Paid" automatically creates a corresponding transaction entry in the expense records.
- **Smart Notification alerts:** Bell notification center in the navbar displaying unread warnings, budget alerts, and renewal reminders.

### ⚙️ Backend & Security
- **Layered Architecture:** Service-Repository-Controller structural separation.
- **Access & Refresh JWT:** Silent access token rotation stored securely.
- **Database Indexing:** Compound indexes on MongoDB for query optimization, soft-delete triggers, and pre-save hooks.
- **Auto-Seeding:** Provision 14 default financial categories and 4 default payment methods on user registration.
- **Midnight Cron Reminders:** Automatically scans upcoming subscriptions/bills (due within 3 days) and registers alert notifications daily.
- **Audit Logging:** Logs creation, updates, and logins along with remote IP addresses.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Runtime** | Node.js (v20+) |
| **Backend Framework** | Express.js (v4.19+) |
| **Database** | MongoDB & Mongoose (v8+) |
| **Charts** | Chart.js (v4.4+) |
| **Documentation** | Swagger (swagger-ui-express & swagger-jsdoc) |
| **File Storage** | Cloudinary & Multer |
| **Task Scheduler** | Node-cron |
| **Styling** | Vanilla CSS (Light Custom Variables) & Bootstrap 5 (CDN) |

---

## 🔌 Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expensetracker
JWT_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
FROM_EMAIL=noreply@expensetracker.com
```

---

## 🏁 Quick Start

### Option A: Using Docker Compose (Simplest)
This sets up MongoDB, serves backend APIs on port `5000`, and serves the frontend client on port `3000`.

```bash
docker-compose up --build
```
- Frontend Client: `http://localhost:3000`
- API docs: `http://localhost:5000/api/docs`

### Option B: Local Running

**1. Run MongoDB locally** on your default port `27017`.

**2. Start the Backend API:**
```bash
cd backend
npm install
npm run dev
```

**3. Start the Frontend client:**
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

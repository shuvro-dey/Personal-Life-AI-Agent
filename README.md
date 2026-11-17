# Personal Life AI Agent

Academic prototype web application unifying three daily task management modules: Shopping Manager, Reminder Tracker, and Study Assistant.

Developed according to the architectural principles and reliability boundaries specified in the System Analysis & Design Capstone Project proposal.

---

## 1. System Overview and Core Principles

The Personal Life AI Agent demonstrates how an AI-assisted coordinator can manage everyday responsibilities while maintaining strict software engineering reliability:
- **Reliability Boundary**: The language model (Google Gemini Interactions API) proposes structured data. Deterministic backend logic calculates costs, evaluates quiz scores, enforces access control, and executes database mutations.
- **User Isolation**: Every database table includes an indexed `user_id` foreign key. A user can never read or mutate another user's records.
- **Security & Privacy**: Passwords are stored strictly as bcrypt hashes (`password_hash`), never in plain text. JWT bearer tokens secure all API endpoints. Secrets such as `GEMINI_API_KEY` reside exclusively in the backend `.env` file and are never sent to the client.
- **Design Restraint**: A quiet, utilitarian interface inspired by Linear and Stripe Dashboard. Zero emojis, neutral slate surfaces, single primary accent (`#1D4ED8`), responsive layout for mobile and desktop, and typography using Inter for English and Hind Siliguri for Bangla.

---

## 2. Technology Stack

- **Backend**:
  - Python 3.11+ / FastAPI
  - SQLite via SQLAlchemy ORM (`backend/app.db`)
  - Bcrypt password hashing and PyJWT token management
  - APScheduler for background reminder checks
  - PyPDF for text extraction from PDF documents
  - Google GenAI SDK (`google-genai`) Interactions API
- **Frontend**:
  - React 18, Vite
  - Tailwind CSS with light and dark mode support
  - Lucide React (restrained utility line icons only)
  - Framer Motion (subtle 120-180ms ease-out transitions only)
  - Axios with JWT request and response interceptors

---

## 3. Directory Structure

```
personal-life-ai-agent/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, shopping, reminders, study, dashboard)
│   │   ├── models/          # SQLAlchemy ORM models with user_id foreign keys
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Business logic, auth, AI wrapper, scheduler, document reader
│   │   ├── utils/           # Timezone calculations (Asia/Dhaka)
│   │   ├── config.py        # Environment settings
│   │   ├── database.py      # SQLite engine with foreign key enforcement
│   │   └── main.py          # FastAPI application entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   ├── test_auth.py
│   ├── test_shopping.py
│   ├── test_reminders.py
│   ├── test_study.py
│   └── test_dashboard.py
├── frontend/
│   ├── src/
│   │   ├── components/      # Common, shopping, reminders, study, and layout components
│   │   ├── context/         # Auth, i18n, Theme, and Notification contexts
│   │   ├── i18n/            # English (en.json) and Bangla (bn.json) dictionaries
│   │   ├── pages/           # Dashboard, Shopping, Reminders, Study, Settings, Auth
│   │   ├── services/        # API client modules
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

---

## 4. Setup and Installation

### Prerequisites
- Python 3.11 or newer
- Node.js 18 or newer and npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your credentials:
   - `GEMINI_API_KEY`: Your Google AI Studio API key. (If left unset, the backend will operate using calm deterministic heuristic fallbacks for testing).
   - `GEMINI_MODEL`: Defaults to `gemini-4-hydrogen` or `gemini-2.5-flash`.
   - `JWT_SECRET`: A secure random secret string.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

---

## 5. Running the Application

### Option A: Run Backend Server
In the `backend` directory (with virtual environment active):
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API and interactive documentation will be accessible at:
- API Base: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

### Option B: Run Frontend Development Server
In the `frontend` directory:
```bash
npm run dev
```
The web application will be accessible at:
- Frontend Application URL: `http://localhost:5173`

---

## 6. Ten Comprehensive Test Scenarios

Run all backend automated test suites to verify end-to-end functionality:
```powershell
backend\venv\Scripts\python backend\test_auth.py
backend\venv\Scripts\python backend\test_shopping.py
backend\venv\Scripts\python backend\test_reminders.py
backend\venv\Scripts\python backend\test_study.py
backend\venv\Scripts\python backend\test_dashboard.py
```

### Scenario 1: User Registration and Password Security
- **Steps**:
  1. Open `http://localhost:5173` and click "Sign up".
  2. Register with email `student@example.com`, name `Student`, and password `SecurePassword123`.
  3. Inspect `backend/app.db` using SQLite tools.
- **Expected Result**: User account is created. The `password_hash` column contains a bcrypt string starting with `$2b$`. Plaintext passwords never appear in the database or server logs.

### Scenario 2: User Login and Profile Localization
- **Steps**:
  1. Sign in with the registered credentials.
  2. Switch the interface language from English to Bangla using the top-right globe button.
- **Expected Result**: JWT token is issued and stored in `localStorage`. All navigation labels, buttons, and status messages render in natural Bangla without page reload. Numerals render in Bengali script (e.g. ১২৩).

### Scenario 3: Shopping List Creation and Deterministic Total Cost
- **Steps**:
  1. Navigate to the "Shopping" tab.
  2. Create a list named "Weekly Groceries".
  3. Add Item 1: `Rice`, Quantity: `2.0`, Unit: `kg`, Price: `70` BDT.
  4. Add Item 2: `Eggs`, Quantity: `1.0`, Unit: `dozen`, Price: `150` BDT.
- **Expected Result**: Backend code computes `(2.0 * 70) + (1.0 * 150) = 290.00 BDT`. The total is displayed on the list card and detail header. Toggling an item marks it as completed with strike-through styling.

### Scenario 4: Natural Language Smart Shopping Parser
- **Steps**:
  1. Open the "Weekly Groceries" list and click "Smart add".
  2. Enter natural text in Bangla: `২ কেজি ডাল, ১ লিটার সয়াবিন তেল, লবণ ৩৫ টাকা`.
  3. Click "Parse items".
  4. Review the editable preview table, modify any quantity, and click "Save to list".
- **Expected Result**: Gemini/parser extracts an items array. The user verifies quantities and prices before confirming. Upon confirmation, items are batch-inserted and the total estimated cost updates deterministically.

### Scenario 5: Scheduled Reminder Creation in Asia/Dhaka Timezone
- **Steps**:
  1. Navigate to the "Reminders" tab.
  2. Click "New reminder".
  3. Enter Title: `Submit Software Architecture Report`, Due Date: Tomorrow's date, Due Time: `16:00`, Repeat: `none`.
  4. Click "Save reminder".
- **Expected Result**: Reminder record is saved with status `pending`. It immediately appears in the "Upcoming" view tab. Times and dates strictly adhere to `Asia/Dhaka` timezone.

### Scenario 6: Smart Reminder Clarification Handling (No Guessing)
- **Steps**:
  1. Click "Smart add" in the Reminders tab.
  2. Enter an ambiguous request without a time: `Remind me to call project partner`.
  3. Click "Extract reminder".
- **Expected Result**: The system refuses to guess an arbitrary time. A calm callout displays: `Please specify the date and time for this reminder.` (or Bengali equivalent). Input fields open to allow the user to provide the exact date and time before saving.

### Scenario 7: Background APScheduler and Notification Alerts
- **Steps**:
  1. Create a reminder scheduled for the current time.
  2. Allow browser notifications when prompted by the application header banner.
  3. Wait 30 seconds for the background APScheduler scanner.
- **Expected Result**: The background scanner detects the due reminder. The frontend receives an in-app toast notification and a native browser alert popup. The reminder's `notified_at` timestamp is updated in the database.

### Scenario 8: Study Session Creation and Document Text Extraction
- **Steps**:
  1. Navigate to the "Study" tab.
  2. Click "New study session".
  3. Upload a sample `.txt` or `.pdf` file (or paste text on Operating Systems / Algorithms).
  4. Select Output Language: `English` or `Bangla`.
  5. Click "Start session".
- **Expected Result**: Backend `document_service` extracts text cleanly from the document. The session appears in the sessions sidebar with a document type badge. Source text is accessible via a collapsible viewer.

### Scenario 9: Summary, Explanation, and Interactive Quiz Grading
- **Steps**:
  1. In the active study session, click "Generate summary" in the Summary tab.
  2. Switch to "Simple explanation" and generate conceptual analogies.
  3. Switch to "Practice quiz" and generate questions.
  4. Answer the multiple-choice questions by selecting radio options and click "Submit answers".
- **Expected Result**: The backend deterministically compares answers against stored records, calculates the exact percentage score (e.g., `3 / 4, 75.0%`), highlights correct and incorrect selections, and reveals the explanation rationale for each question.

### Scenario 10: Multi-Turn Streaming Follow-Up Study Chat
- **Steps**:
  1. Inside the active study session, click the "Follow-up chat" tab.
  2. Ask a conceptual question: `Can you explain virtual memory paging based on the text?`.
  3. Send a follow-up question referencing the prior answer.
- **Expected Result**: The response streams in real-time chunk by chunk via Server-Sent Events. The backend maintains stateful conversation context using `gemini_interaction_id` via Google GenAI Interactions API.

---

## 7. Cross-User Data Isolation Verification

The backend enforces user isolation at the database query level:
```python
# All database operations strictly match the authenticated user's ID
item = db.query(ShoppingItem).filter(
    ShoppingItem.id == item_id,
    ShoppingItem.user_id == current_user.id
).first()
if not item:
    raise HTTPException(status_code=404, detail="Shopping item not found")
```
When User B attempts to read, edit, or delete any record created by User A, the backend returns `404 Not Found`, ensuring total cross-user data isolation.

---

## 8. Emojis and Visual Restraint Compliance

- **Zero Emojis**: The entire codebase (backend Python code, frontend JSX, Tailwind styles, JSON translation files, test scripts, and documentation) has been scanned and verified to contain exactly zero emojis or decorative unicode symbols.
- **Color Discipline**: Single deep blue accent (`#1D4ED8`), neutral slate surfaces, 8px radius cards, 6px radius buttons/inputs, and visible focus rings.

# DelegateOS — Executive Delegation & Verification System

DelegateOS is a React/Vite task delegation application using Supabase Auth and PostgreSQL for shared accounts, tasks, and notifications. Review and test its access policies before using sensitive business data.

---

## 🚀 Key Features

- **Dual Task Architecture**:
  - **Recurring SOP Tasks**: Daily, Weekly, Bi-weekly, or Monthly routine tasks with streaks and completion logs.
  - **Delegation Tasks**: Strategic one-off tasks with deadlines, priority levels, and deliverables.
- **3-Tier Delegation Hierarchy**:
  - **Primary Doer**: Holds primary execution SLA.
  - **Secondary Doer**: Backup assignee and peer reviewer.
  - **Sub-Secondary Doer**: Third-level escalation fallback.
- **Visual Proof & Verification Loop**:
  - Doers submit completion descriptions, logged time, and image proof (screenshots, receipts, reports).
  - Admin/Owner inspects image evidence via full-screen zoom lightbox.
  - **"Verify & Mark as Done"**: Confirms completion and credits quality score points (+100).
  - **"Task Needs Correction"**: Sends targeted feedback and flags issues; the doer receives a high-priority correction notification to fix and resubmit.
- **Role-Based Access Control (RBAC)**:
  - **Owner (Admin)**: Full system access across all tasks, employee scorecards, credential vaults, and export tools.
  - **Employee (Doer)**: Strictly isolated workspace. Employees only see tasks assigned to them (Primary, Secondary, or Sub-Secondary). Other employees' tasks are completely hidden.
- **Supabase Authentication**:
  - Employees sign in using accounts managed by Supabase Auth.
  - Administrators invite employees through a server-side Supabase Edge Function.
  - Passwords are never stored or exported by the application.
- **Data Extraction & Backup**:
  - 1-Click JSON full database backup.
  - 1-Click CSV export for Microsoft Excel / Google Sheets.
  - Employee roster export excludes passwords.
  - Task JSON import maps old employee IDs by email to existing Supabase profiles.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Database & Auth**: Supabase
- **Hosting Ready**: Vercel, Netlify, Cloud Run, Firebase Hosting

---

## 💻 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Configuration

1. Copy the project URL and publishable key from the Supabase project’s **Connect** panel.
2. Create `.env.local` in the project root:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

3. Apply the SQL migrations in `supabase/migrations` in filename order using the Supabase SQL Editor. Existing projects that already applied migrations `202610150001_initial_schema.sql` and `202610150002_application_data.sql` should also apply later migrations as they are added.
4. Deploy the `invite-employee` Edge Function. From a terminal in the project folder, install/use the Supabase CLI, log in, link the project, then deploy:

   ```powershell
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase functions deploy invite-employee
   ```

   The function uses Supabase’s server-side environment variables; never add the service-role key to the Vite app or Vercel frontend variables.
5. In Supabase **Authentication → URL Configuration**, set the site URL and allow the local and deployed app password setup routes (for example `http://localhost:3000/set-password` and `https://your-deployed-app.vercel.app/set-password`) as redirect URLs. Employee invitation and password-reset links open this route so employees set their own passwords; no password is sent by email.
6. Create the first user in **Authentication → Users**, then grant the admin role through the SQL Editor. Do not set role permissions from browser code.
7. To change an account’s login email, update it in **Authentication → Users**. Confirm the change using the verification message sent by Supabase; the profile email is synchronized automatically by migration `202610150003_sync_auth_email.sql`.

The free Supabase plan can pause projects after a period of inactivity. Check current plan limits and availability needs before production use.

Existing browser Local Storage data is not uploaded automatically. To migrate tasks, export a JSON backup from the old app, create matching employee accounts in Supabase first, then import the backup from the admin data tool. Profile and authentication records are not imported from the JSON file.

### 3. Build for Production
```bash
npm run build
```
The production bundle will be generated in the `dist/` directory.

---

---

## 🌐 Deploying to Vercel

1. Push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New..." → "Project"**.
3. Select your GitHub repository.
4. Framework preset will automatically be set to **Vite**.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under **Project Settings → Environment Variables**, then click **Deploy**.
6. Under **Project Settings → Domains**, add your custom domain (e.g. `delegation.yourcompany.com`).

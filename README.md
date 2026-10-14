# DelegateOS — Executive Delegation & Verification System

DelegateOS is a production-ready delegation and accountability management system built for executive teams and office workflows. It features a strict 3-tier delegation hierarchy, image proof inspections, review-and-correction loops, and employee data privacy.

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
- **Admin Credential & Password Vault**:
  - View all employee IDs and reveal passwords.
  - Reset or generate strong passwords for any team member.
  - Add new office employees.
- **Data Extraction & Backup**:
  - 1-Click JSON full database backup.
  - 1-Click CSV export for Microsoft Excel / Google Sheets.
  - 1-Click employee credential directory export.
  - JSON database restore/migration.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
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

### 3. Build for Production
```bash
npm run build
```
The production bundle will be generated in the `dist/` directory.

---

## 🔑 Initial Default Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Owner / Admin** | `david.owner@enterprise.co` | `password123` | Full Admin (All Tasks & Vault) |
| **Operations Lead** | `alex.j@enterprise.co` | `password123` | Restricted to Alex's tasks |
| **Marketing Lead** | `sarah.lin@enterprise.co` | `password123` | Restricted to Sarah's tasks |
| **Systems Architect** | `marcus.v@enterprise.co` | `password123` | Restricted to Marcus's tasks |
| **Finance Director** | `priya.p@enterprise.co` | `password123` | Restricted to Priya's tasks |

*Note: All passwords and emails can be modified or reset anytime by the Admin in the in-app Credential Vault.*

---

## 🌐 Deploying to Vercel

1. Push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New..." → "Project"**.
3. Select your GitHub repository.
4. Framework preset will automatically be set to **Vite**.
5. Click **Deploy**.
6. Under **Project Settings → Domains**, add your custom domain (e.g. `delegation.yourcompany.com`).

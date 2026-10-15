import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Database,
  Globe,
  Server,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Code,
  Layers,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface DataExportModalProps {
  onClose: () => void;
}

export const DataExportModal: React.FC<DataExportModalProps> = ({ onClose }) => {
  const {
    exportAllDataJSON,
    exportTasksCSV,
    exportUsersCSV,
    importAllData,
    tasks,
    teamMembers,
  } = useTasks();

  const [activeTab, setActiveTab] = useState<'EXPORT' | 'FIREBASE_GUIDE' | 'VERCEL_GUIDE'>('EXPORT');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Download helpers
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const json = exportAllDataJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(json, `delegateos_full_database_${dateStr}.json`, 'application/json');
  };

  const handleDownloadTasksCSV = () => {
    const csv = exportTasksCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `delegateos_tasks_report_${dateStr}.csv`, 'text/csv');
  };

  const handleDownloadUsersCSV = () => {
    const csv = exportUsersCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `delegateos_employee_roster_${dateStr}.csv`, 'text/csv');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const success = importAllData(content);
          if (success) {
            setImportStatus('Database successfully restored and updated!');
            setTimeout(() => setImportStatus(null), 4000);
          } else {
            setImportStatus('Failed to parse backup file. Please verify valid JSON format.');
          }
        } catch {
          setImportStatus('Error importing file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyCode = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(key);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  BACKEND & DEPLOYMENT MANAGEMENT
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  OFFICE PRODUCTION
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Data Extraction, Firebase Backend & Vercel Deployment
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'EXPORT'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Extract & Download Data</span>
          </button>
          <button
            onClick={() => setActiveTab('FIREBASE_GUIDE')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'FIREBASE_GUIDE'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Firebase Backend Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('VERCEL_GUIDE')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'VERCEL_GUIDE'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Vercel & Custom Domain Setup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          {importStatus && (
            <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* TAB 1: EXTRACT & DOWNLOAD */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm mb-1">
                  1-Click Office Data Extraction & Backup
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Download complete copies of your office delegation records, proofs, and employee credentials. These files can be opened in Excel, imported to Google Sheets, or used to migrate databases.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Full JSON DB */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                      <Database className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-white text-sm">Full Database JSON</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Complete database containing all {tasks.length} tasks, audit trails, activity logs, recurrence rules, and employee scorecards.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadJSON}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center space-x-2 transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* 2. Tasks CSV Report */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-white text-sm">Tasks & Proofs CSV</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Excel / Google Sheets spreadsheet with all task deadlines, assigned primary & secondary doers, verification notes, and scores.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTasksCSV}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center space-x-2 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Tasks CSV</span>
                  </button>
                </div>

                {/* 3. Employee Roster CSV */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h5 className="font-bold text-white text-sm">Employee Roster CSV</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Employee IDs, names, departments, access levels, and login emails. Passwords are never exported.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadUsersCSV}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center space-x-2 transition-colors shadow-md shadow-purple-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download User Roster</span>
                  </button>
                </div>
              </div>

              {/* Import / Restore Database */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                      Restore / Migrate Database
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Upload previously exported JSON backup
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Backup File (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    This will replace current local tasks and users with the uploaded dataset.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIREBASE BACKEND GUIDE */}
          {activeTab === 'FIREBASE_GUIDE' && (
            <div className="space-y-6 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  How to Connect Firebase Firestore for Real-Time Office Persistence
                </h4>
                <p className="leading-relaxed">
                  DelegateOS already operates fully client-side and offline with persistent local storage. If you want multi-device real-time sync across all office computers, follow these steps to connect Firebase Firestore:
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-white text-xs">
                      1. Create a Firebase Project
                    </h5>
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline flex items-center space-x-1 text-[11px]"
                    >
                      <span>Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                    <li>Go to Firebase Console and click <strong>"Add project"</strong> (e.g. <code>my-office-delegation</code>).</li>
                    <li>In the left sidebar, click <strong>"Build" → "Firestore Database"</strong> and click <strong>"Create Database"</strong>.</li>
                    <li>Select <strong>Start in production mode</strong> and choose your closest cloud location.</li>
                  </ol>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-white text-xs">
                      2. Add Web App & Copy Config Keys
                    </h5>
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-3">
                    Click the <strong>Web (&lt;/&gt;)</strong> icon in Project Overview to register an app. Copy the credentials into your <code>.env</code> file:
                  </p>
                  <div className="relative bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                    <pre className="overflow-x-auto whitespace-pre">
{`VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="my-office.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="my-office"
VITE_FIREBASE_STORAGE_BUCKET="my-office.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="12345678"
VITE_FIREBASE_APP_ID="1:12345678:web:abcdef"`}
                    </pre>
                    <button
                      onClick={() => copyCode(`VITE_FIREBASE_API_KEY="AIzaSy..."\nVITE_FIREBASE_AUTH_DOMAIN="my-office.firebaseapp.com"\nVITE_FIREBASE_PROJECT_ID="my-office"\nVITE_FIREBASE_STORAGE_BUCKET="my-office.appspot.com"\nVITE_FIREBASE_MESSAGING_SENDER_ID="12345678"\nVITE_FIREBASE_APP_ID="1:12345678:web:abcdef"`, 'env')}
                      className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copiedSnippet === 'env' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h5 className="font-bold text-white text-xs mb-2">
                    3. Recommended Firestore Security Rules
                  </h5>
                  <p className="text-slate-400 mb-2">
                    In Firebase Console → Firestore Database → <strong>Rules</strong>, paste the following rules:
                  </p>
                  <div className="relative bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
                    <pre className="overflow-x-auto whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if true; // Protected by client RBAC
    }
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL DEPLOYMENT & CUSTOM DOMAIN */}
          {activeTab === 'VERCEL_GUIDE' && (
            <div className="space-y-6 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200">
                <h4 className="font-bold text-cyan-300 text-sm mb-1">
                  Deploying to Vercel with Your Custom Office Domain
                </h4>
                <p className="leading-relaxed">
                  Vercel provides automatic SSL HTTPS, worldwide global CDN edge caching, and seamless custom domain routing.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-xs">
                    Step 1: Push Code to GitHub / GitLab
                  </h5>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                    git init<br />
                    git add .<br />
                    git commit -m "feat: DelegateOS office delegation system"<br />
                    git branch -M main<br />
                    git remote add origin https://github.com/YOUR_USERNAME/office-delegation.git<br />
                    git push -u origin main
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-xs">
                    Step 2: Import Project on Vercel
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Log in to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Vercel.com</a>.</li>
                    <li>Click <strong>"Add New..." → "Project"</strong> and select your GitHub repository.</li>
                    <li>Framework Preset will automatically be detected as <strong>Vite</strong>.</li>
                    <li>Build Command: <code>npm run build</code> | Output Directory: <code>dist</code>.</li>
                    <li>Click <strong>Deploy</strong>. In ~30 seconds, your website will be live!</li>
                  </ol>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-xs">
                    Step 3: Connect Your Custom Domain (e.g. delegation.yourcompany.com)
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>In your Vercel project dashboard, go to <strong>Settings → Domains</strong>.</li>
                    <li>Enter your office domain (e.g. <code>app.yourdomain.com</code> or <code>yourdomain.com</code>) and click <strong>Add</strong>.</li>
                    <li>Vercel will give you the DNS records to enter in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
                      <ul className="list-disc list-inside ml-4 mt-1 text-slate-300">
                        <li><strong>CNAME record</strong> for subdomains: point to <code>cname.vercel-dns.com</code></li>
                        <li><strong>A record</strong> for root domain: point to <code>76.76.21.21</code></li>
                      </ul>
                    </li>
                    <li>SSL certificate will automatically be generated in ~2 minutes for free!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

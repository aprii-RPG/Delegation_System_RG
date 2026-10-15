/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Navbar } from './components/Navbar';
import { Task, TeamMember } from './types';
import {
  Shield,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Send,
  Sparkles,
  Lock,
  LogOut,
  KeyRound,
  Download,
} from 'lucide-react';

const LoginScreen = lazy(() =>
  import('./components/LoginScreen').then((module) => ({ default: module.LoginScreen }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const DoerPortal = lazy(() =>
  import('./components/DoerPortal').then((module) => ({ default: module.DoerPortal }))
);
const VerifyModal = lazy(() =>
  import('./components/VerifyModal').then((module) => ({ default: module.VerifyModal }))
);
const SubmitProofModal = lazy(() =>
  import('./components/SubmitProofModal').then((module) => ({ default: module.SubmitProofModal }))
);
const TaskDetailModal = lazy(() =>
  import('./components/TaskDetailModal').then((module) => ({ default: module.TaskDetailModal }))
);
const CreateTaskModal = lazy(() =>
  import('./components/CreateTaskModal').then((module) => ({ default: module.CreateTaskModal }))
);
const NotificationsModal = lazy(() =>
  import('./components/NotificationsModal').then((module) => ({ default: module.NotificationsModal }))
);
const DoerScorecardsModal = lazy(() =>
  import('./components/DoerScorecardsModal').then((module) => ({ default: module.DoerScorecardsModal }))
);
const UserManagementModal = lazy(() =>
  import('./components/UserManagementModal').then((module) => ({ default: module.UserManagementModal }))
);
const DataExportModal = lazy(() =>
  import('./components/DataExportModal').then((module) => ({ default: module.DataExportModal }))
);
const EditAvatarModal = lazy(() =>
  import('./components/EditAvatarModal').then((module) => ({ default: module.EditAvatarModal }))
);
const SendMeetingLinkModal = lazy(() =>
  import('./components/SendMeetingLinkModal').then((module) => ({ default: module.SendMeetingLinkModal }))
);

const MainContent: React.FC = () => {
  const {
    currentUser,
    ownerUser,
    teamMembers,
    tasks,
    allTasks,
    isAuthenticated,
    isLoading,
    dataError,
    logout,
  } = useTasks();

  // Modal states
  const [taskForVerify, setTaskForVerify] = useState<Task | null>(null);
  const [taskForSubmitProof, setTaskForSubmitProof] = useState<Task | null>(null);
  const [taskForDetails, setTaskForDetails] = useState<Task | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScorecardsOpen, setIsScorecardsOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isDataExportOpen, setIsDataExportOpen] = useState(false);
  const [taskForMeetingLink, setTaskForMeetingLink] = useState<Task | null>(null);
  const [avatarUserModal, setAvatarUserModal] = useState<TeamMember | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-sm">
        Connecting securely to DelegateOS…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {dataError && (
          <div role="alert" className="bg-rose-950 text-rose-200 px-4 py-3 text-sm text-center">
            {dataError}
          </div>
        )}
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <LoginScreen />
        </Suspense>
      </>
    );
  }

  // Fast switch to another task from notification
  const handleSelectTaskFromNotifications = (task: Task) => {
    if (task.status === 'SUBMITTED_FOR_VERIFICATION' && currentUser.isOwner) {
      setTaskForVerify(task);
    } else if (task.status === 'NEEDS_CORRECTION' && !currentUser.isOwner) {
      setTaskForSubmitProof(task);
    } else {
      setTaskForDetails(task);
    }
  };

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-sm">Loading workspace…</div>}>
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {dataError && (
        <div role="alert" className="bg-rose-950 text-rose-200 px-4 py-3 text-sm text-center">
          {dataError}
        </div>
      )}
      {/* Top Navigation */}
      <Navbar
        onOpenCreateTask={() => setIsCreateTaskOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenScorecards={() => setIsScorecardsOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenDataExport={() => setIsDataExportOpen(true)}
        onOpenEditAvatar={(member) => setAvatarUserModal(member || currentUser)}
      />

      {/* Access Control & Data Isolation Status Banner */}
      <div className={`border-b text-xs py-2 px-4 transition-colors ${
        currentUser.isOwner
          ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {currentUser.isOwner ? (
              <>
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-bold text-white">Owner Administrator Session:</span>
                <span className="text-indigo-300">
                  Full visibility active. Viewing all {allTasks.length} organization tasks and {teamMembers.length} employees.
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">Employee Session ({currentUser.name}):</span>
                <span className="text-emerald-300">
                  Strict Data Privacy Active — Showing ONLY your {tasks.length} assigned task(s). Another person's tasks are completely hidden.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={logout}
              className="text-xs text-rose-300 hover:text-white px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 flex items-center space-x-1.5 transition-colors font-medium shadow-sm"
              title="Sign Out to Login with another email and password"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.isOwner ? (
          <AdminDashboard
            onOpenVerify={(task) => setTaskForVerify(task)}
            onOpenSubmitProof={(task) => setTaskForSubmitProof(task)}
            onOpenTaskDetails={(task) => setTaskForDetails(task)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            onOpenScorecards={() => setIsScorecardsOpen(true)}
            onOpenUserManagement={() => setIsUserManagementOpen(true)}
            onOpenDataExport={() => setIsDataExportOpen(true)}
            onOpenEditAvatar={(member) => setAvatarUserModal(member)}
            onOpenSendMeetingLink={(task) => setTaskForMeetingLink(task)}
          />
        ) : (
          <DoerPortal
            onOpenVerify={(task) => setTaskForVerify(task)}
            onOpenSubmitProof={(task) => setTaskForSubmitProof(task)}
            onOpenTaskDetails={(task) => setTaskForDetails(task)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            onOpenScorecards={() => setIsScorecardsOpen(true)}
            onOpenSendMeetingLink={(task) => setTaskForMeetingLink(task)}
          />
        )}
      </main>

      {/* MODALS */}

      {/* 1. Verify Modal (Owner inspects proof & either verifies or requests correction) */}
      {taskForVerify && (
        <VerifyModal
          task={taskForVerify}
          onClose={() => setTaskForVerify(null)}
        />
      )}

      {/* 2. Submit Proof Modal (Doer completes task with image proof, notes, metrics) */}
      {taskForSubmitProof && (
        <SubmitProofModal
          task={taskForSubmitProof}
          onClose={() => setTaskForSubmitProof(null)}
        />
      )}

      {/* 2b. Meeting Link Dispatch Modal */}
      {taskForMeetingLink && (
        <SendMeetingLinkModal
          task={taskForMeetingLink}
          onClose={() => setTaskForMeetingLink(null)}
        />
      )}

      {/* 3. Task Detail & Audit Modal */}
      {taskForDetails && (
        <TaskDetailModal
          task={taskForDetails}
          onClose={() => setTaskForDetails(null)}
          onOpenVerify={(task) => {
            setTaskForDetails(null);
            setTaskForVerify(task);
          }}
          onOpenSubmitProof={(task) => {
            setTaskForDetails(null);
            setTaskForSubmitProof(task);
          }}
        />
      )}

      {/* 4. Create Task Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} />
      )}

      {/* 5. Notifications Drawer / Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          onClose={() => setIsNotificationsOpen(false)}
          onSelectTask={handleSelectTaskFromNotifications}
        />
      )}

      {/* 6. Doer Scorecards Deep-Dive Modal */}
      {isScorecardsOpen && (
        <DoerScorecardsModal onClose={() => setIsScorecardsOpen(false)} />
      )}

      {/* 7. Admin User & Password Governance Vault Modal */}
      {isUserManagementOpen && (
        <UserManagementModal onClose={() => setIsUserManagementOpen(false)} />
      )}

      {/* 8. Data Extraction, Firebase & Deployment Backup Modal */}
      {isDataExportOpen && (
        <DataExportModal onClose={() => setIsDataExportOpen(false)} />
      )}

      {/* 9. Profile Avatar & Photo Customizer Modal */}
      {avatarUserModal && (
        <EditAvatarModal
          user={avatarUserModal}
          onClose={() => setAvatarUserModal(null)}
        />
      )}
    </div>
    </Suspense>
  );
};

export default function App() {
  return (
    <TaskProvider>
      <MainContent />
    </TaskProvider>
  );
}

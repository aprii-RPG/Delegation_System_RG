/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { DoerPortal } from './components/DoerPortal';
import { VerifyModal } from './components/VerifyModal';
import { SubmitProofModal } from './components/SubmitProofModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DoerScorecardsModal } from './components/DoerScorecardsModal';
import { UserManagementModal } from './components/UserManagementModal';
import { DataExportModal } from './components/DataExportModal';
import { EditAvatarModal } from './components/EditAvatarModal';
import { SendMeetingLinkModal } from './components/SendMeetingLinkModal';
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

const MainContent: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    ownerUser,
    teamMembers,
    tasks,
    allTasks,
    isAuthenticated,
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

  // If not authenticated, show corporate login screen first
  if (!isAuthenticated) {
    return <LoginScreen />;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-20">
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
                  Full visibility active. Viewing all {allTasks.length} organization tasks & all 4 employees.
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
  );
};

export default function App() {
  return (
    <TaskProvider>
      <MainContent />
    </TaskProvider>
  );
}

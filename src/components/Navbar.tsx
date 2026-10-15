import React, { useState } from 'react';
import {
  Shield,
  User,
  Bell,
  Plus,
  Sparkles,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Award,
  Layers,
  LogOut,
  Lock,
  KeyRound,
  Download,
  Camera,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TeamMember } from '../types';

interface NavbarProps {
  onOpenCreateTask: () => void;
  onOpenNotifications: () => void;
  onOpenScorecards: () => void;
  onOpenUserManagement?: () => void;
  onOpenDataExport?: () => void;
  onOpenEditAvatar?: (user: TeamMember) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateTask,
  onOpenNotifications,
  onOpenScorecards,
  onOpenUserManagement,
  onOpenDataExport,
  onOpenEditAvatar,
}) => {
  const {
    currentUser,
    unreadNotificationCount,
    tasks,
    logout,
  } = useTasks();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Compute urgent correction alerts for doers
  const myCorrectionCount = tasks.filter(
    (t) => t.primaryDoerId === currentUser.id && t.status === 'NEEDS_CORRECTION'
  ).length;

  // Compute pending verification count for owner
  const pendingVerificationCount = tasks.filter(
    (t) => t.status === 'SUBMITTED_FOR_VERIFICATION'
  ).length;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20 text-white font-black text-xl tracking-wider">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                  DELEGATE<span className="text-indigo-400">OS</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  EXECUTIVE VERIFICATION ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                3-Tier Delegation • Proof Verification • Doer Scorecards
              </p>
            </div>
          </div>

          {/* Right Action Section */}
          <div className="flex items-center space-x-3">
            {/* Quick Scorecards Button */}
            <button
              onClick={onOpenScorecards}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all shadow-sm"
              title="View 4 Doers Performance & Scorecards"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Scorecards</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-md animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {currentUser.isOwner && (
              <button
                onClick={onOpenCreateTask}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Delegation</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            {/* Signed-in account menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl border transition-all ${
                  currentUser.isOwner
                    ? 'bg-indigo-950/40 border-indigo-500/40 hover:border-indigo-400 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-800"
                  />
                  {currentUser.isOwner ? (
                    <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-0.5 rounded-full ring-2 ring-slate-950">
                      <Shield className="w-2.5 h-2.5" />
                    </span>
                  ) : myCorrectionCount > 0 ? (
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full ring-2 ring-slate-950 font-bold text-[8px]">
                      !
                    </span>
                  ) : null}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold leading-tight block">
                      {currentUser.name}
                    </span>
                    {currentUser.isOwner && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                    {currentUser.roleTitle}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switcher Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 p-2 divide-y divide-slate-800">
                    {/* Logged in User Profile Info */}
                    <div className="p-3">
                      <div className="flex items-center space-x-3 mb-2.5">
                        <div
                          onClick={() => {
                            if (onOpenEditAvatar) {
                              setIsUserMenuOpen(false);
                              onOpenEditAvatar(currentUser);
                            }
                          }}
                          className="relative cursor-pointer group shrink-0"
                          title="Click to change your photo"
                        >
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all bg-slate-800"
                          />
                          <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Camera className="w-4 h-4 text-indigo-300" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-white truncate">{currentUser.name}</span>
                            {currentUser.isOwner && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                                OWNER
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block font-mono truncate">{currentUser.email}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{currentUser.roleTitle}</span>
                        </div>
                      </div>

                      {/* Direct Edit Avatar Button */}
                      {onOpenEditAvatar && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenEditAvatar(currentUser);
                          }}
                          className="w-full mb-2.5 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Change Profile Avatar & Photo</span>
                        </button>
                      )}

                      <div className="text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                        {currentUser.isOwner ? (
                          <span className="text-indigo-300 font-medium block">
                            👑 Administrator account.
                          </span>
                        ) : (
                          <span className="text-emerald-300 font-medium block">
                            🔒 Employee Mode: Only your assigned tasks are visible. Another person's tasks are completely hidden.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Owner Management Shortcuts */}
                    {currentUser.isOwner && (
                      <div className="p-2 border-b border-slate-800 space-y-1">
                        {onOpenUserManagement && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenUserManagement();
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left"
                          >
                            <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>Manage Employees</span>
                          </button>
                        )}
                        {onOpenDataExport && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenDataExport();
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left"
                          >
                            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Extract Data & Backup</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Account actions */}
                    <div className="p-2 space-y-1.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/80 border border-rose-500/30 transition-all shadow-sm"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Switch Account)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center space-x-1"
              title="Sign Out to Login Screen"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs hidden xl:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

    </header>
  );
};

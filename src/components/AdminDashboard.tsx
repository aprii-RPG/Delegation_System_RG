import React, { useState } from 'react';
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Repeat,
  Send,
  Award,
  Search,
  Filter,
  Eye,
  Plus,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  KeyRound,
  Download,
  Database,
  Camera,
  Video,
  Mail,
} from 'lucide-react';
import { Task, TaskType, TaskStatus, TaskPriority, TeamMember } from '../types';
import { useTasks } from '../context/TaskContext';
import { TaskCard } from './TaskCard';

interface AdminDashboardProps {
  onOpenVerify: (task: Task) => void;
  onOpenSubmitProof: (task: Task) => void;
  onOpenTaskDetails: (task: Task) => void;
  onOpenCreateTask: () => void;
  onOpenScorecards: () => void;
  onOpenUserManagement: () => void;
  onOpenDataExport: () => void;
  onOpenEditAvatar?: (member: TeamMember) => void;
  onOpenSendMeetingLink?: (task: Task) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenVerify,
  onOpenSubmitProof,
  onOpenTaskDetails,
  onOpenCreateTask,
  onOpenScorecards,
  onOpenUserManagement,
  onOpenDataExport,
  onOpenEditAvatar,
  onOpenSendMeetingLink,
}) => {
  const { tasks, doerScorecards, teamMembers, ownerUser } = useTasks();

  const [activeTab, setActiveTab] = useState<'ALL' | 'VERIFY_QUEUE' | 'CORRECTIONS' | 'RECURRING' | 'DELEGATION' | 'MEETINGS' | 'DONE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoerId, setSelectedDoerId] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // KPI Calculations
  const totalTasks = tasks.length;
  const pendingVerificationTasks = tasks.filter((t) => t.status === 'SUBMITTED_FOR_VERIFICATION');
  const needsCorrectionTasks = tasks.filter((t) => t.status === 'NEEDS_CORRECTION');
  const verifiedDoneTasks = tasks.filter((t) => t.status === 'VERIFIED_DONE');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING');
  const recurringTasksCount = tasks.filter((t) => t.type === 'RECURRING').length;
  const delegationTasksCount = tasks.filter((t) => t.type === 'DELEGATION').length;

  const averageAccountability = Math.round(
    doerScorecards.reduce((acc, c) => acc + c.overallAccountabilityScore, 0) /
      Math.max(doerScorecards.length, 1)
  );

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (activeTab === 'VERIFY_QUEUE' && t.status !== 'SUBMITTED_FOR_VERIFICATION') return false;
    if (activeTab === 'CORRECTIONS' && t.status !== 'NEEDS_CORRECTION') return false;
    if (activeTab === 'RECURRING' && t.type !== 'RECURRING') return false;
    if (activeTab === 'DELEGATION' && t.type !== 'DELEGATION') return false;
    if (activeTab === 'MEETINGS' && !t.meetingDetails?.isMeeting) return false;
    if (activeTab === 'DONE' && t.status !== 'VERIFIED_DONE') return false;

    // Doer filter
    if (selectedDoerId !== 'ALL') {
      if (
        t.primaryDoerId !== selectedDoerId &&
        t.secondaryDoerId !== selectedDoerId &&
        t.subSecondaryDoerId !== selectedDoerId
      ) {
        return false;
      }
    }

    // Priority filter
    if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Hero Banner & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Owner Executive Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Task Delegation & Verification Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Monitor primary, secondary, and sub-secondary task handoffs across your 4 team members. Review proof submissions, issue corrections, and track accountability scores in real time.
          </p>
        </div>

        {/* Owner Profile Badge & Avatar Customizer */}
        <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 shrink-0">
          <div
            onClick={() => onOpenEditAvatar?.(ownerUser)}
            className="relative cursor-pointer group shrink-0"
            title="Click to customize Owner Avatar / Photo"
          >
            <img
              src={ownerUser.avatar}
              alt={ownerUser.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all bg-slate-800"
            />
            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-4 h-4 text-indigo-300" />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full ring-2 ring-slate-950">
              <Shield className="w-2.5 h-2.5" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white truncate">{ownerUser.name}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                OWNER
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">{ownerUser.roleTitle}</span>
            <button
              onClick={() => onOpenEditAvatar?.(ownerUser)}
              className="inline-flex items-center space-x-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold mt-0.5 transition-colors"
            >
              <Camera className="w-3 h-3" />
              <span>Change Photo</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenUserManagement}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 transition-all shadow-sm"
            title="View, Edit and Reset Employee Passwords & IDs"
          >
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Passwords & IDs</span>
          </button>

          <button
            onClick={onOpenDataExport}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm"
            title="Download Data (JSON/CSV) & Firebase Guide"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Extract Data</span>
          </button>

          <button
            onClick={onOpenScorecards}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-sm"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Scorecards</span>
          </button>

          <button
            onClick={onOpenCreateTask}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Delegate Task</span>
          </button>
        </div>
      </div>

      {/* Verification Queue Urgent Alert Banner (If owner has tasks waiting) */}
      {pendingVerificationTasks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/20 border border-purple-500/40 shadow-xl shadow-purple-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 animate-pulse shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  {pendingVerificationTasks.length} Task Proof Submissions Awaiting Your Inspection
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-mono font-bold">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Doers have submitted image evidence and completion descriptions. Verify clear results or request necessary corrections.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('VERIFY_QUEUE');
              if (pendingVerificationTasks[0]) {
                onOpenVerify(pendingVerificationTasks[0]);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 flex items-center space-x-1.5 self-start sm:self-auto transition-transform hover:scale-[1.02]"
          >
            <FileCheck className="w-4 h-4" />
            <span>Inspect Next Proof</span>
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Total Delegated */}
        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Workload</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {recurringTasksCount} Rec / {delegationTasksCount} Del
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalTasks}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active across 4 doers</span>
          </div>
        </div>

        {/* 2. Verification Queue (High Priority) */}
        <div
          onClick={() => setActiveTab('VERIFY_QUEUE')}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            pendingVerificationTasks.length > 0
              ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-400 shadow-md shadow-purple-950/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-purple-300 mb-2">
            <span className="text-xs font-semibold">Verification Queue</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
              {pendingVerificationTasks.length}
            </div>
            <span className="text-[11px] text-purple-400/80 mt-1 block font-medium">
              Click to inspect proof
            </span>
          </div>
        </div>

        {/* 3. Needs Correction */}
        <div
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`cursor-pointer p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            needsCorrectionTasks.length > 0
              ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-950/20'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-semibold">In Correction</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              {needsCorrectionTasks.length}
            </div>
            <span className="text-[11px] text-amber-400/80 mt-1 block font-medium">
              Awaiting doer fixes
            </span>
          </div>
        </div>

        {/* 4. Verified Done */}
        <div
          onClick={() => setActiveTab('DONE')}
          className="cursor-pointer bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-semibold">Verified Complete</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {verifiedDoneTasks.length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Approved & Stamped</span>
          </div>
        </div>

        {/* 5. Team Accountability Score */}
        <div
          onClick={onOpenScorecards}
          className="cursor-pointer col-span-2 lg:col-span-1 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-indigo-300 mb-2">
            <span className="text-xs font-semibold">Accountability Index</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              {averageAccountability}%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Average of 4 doers</span>
          </div>
        </div>
      </div>

      {/* The 4 Doers Quick Scorecard Strip */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              The 4 Assigned Doers Performance Live Status
            </h3>
          </div>
          <button
            onClick={onOpenScorecards}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Full Analysis</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {doerScorecards.map((card) => {
            const member = teamMembers.find((m) => m.id === card.memberId);
            return (
              <div
                key={card.memberId}
                onClick={() => {
                  setSelectedDoerId(card.memberId);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedDoerId === card.memberId
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (member) onOpenEditAvatar?.(member);
                      }}
                      className="relative cursor-pointer group shrink-0"
                      title={`Click to customize photo for ${card.memberName}`}
                    >
                      <img
                        src={card.avatar}
                        alt={card.memberName}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 transition-all bg-slate-800"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Camera className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-white block truncate max-w-25">
                          {card.memberName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (member) onOpenEditAvatar?.(member);
                          }}
                          className="text-slate-500 hover:text-indigo-300 p-0.5 rounded transition-colors"
                          title="Change Photo"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[110px]">
                        {card.roleTitle}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-indigo-300 font-mono">
                      {card.overallAccountabilityScore}
                    </span>
                    <span className="text-[9px] text-slate-500 block">SCORE</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-900 text-center text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Verified</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {card.totalCompletedAndVerified}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Review</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {card.pendingVerificationCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fixes</span>
                    <span
                      className={`font-bold font-mono ${
                        card.needsCorrectionCount > 0 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {card.needsCorrectionCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Tasks ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('VERIFY_QUEUE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'VERIFY_QUEUE'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:bg-purple-950/40 border border-purple-500/20'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspection Queue ({pendingVerificationTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CORRECTIONS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'CORRECTIONS'
                ? 'bg-amber-600 text-slate-950 shadow-sm'
                : 'text-amber-300 hover:bg-amber-950/40 border border-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Correction ({needsCorrectionTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RECURRING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'RECURRING'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Recurring SOPs ({recurringTasksCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('DELEGATION')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'DELEGATION'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Delegation Tasks ({delegationTasksCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('MEETINGS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'MEETINGS'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:bg-purple-950/40 border border-purple-500/20'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Meetings ({tasks.filter((t) => t.meetingDetails?.isMeeting).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DONE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'DONE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Done ({verifiedDoneTasks.length})</span>
          </button>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, category, or instructions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Doer filter dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={selectedDoerId}
              onChange={(e) => setSelectedDoerId(e.target.value)}
              className="w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All 4 Doers</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Priority filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full sm:w-36 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
          <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No tasks match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try resetting your search query or switching tabs to view other active assignments.
          </p>
          <button
            onClick={() => {
              setActiveTab('ALL');
              setSearchQuery('');
              setSelectedDoerId('ALL');
              setSelectedPriority('ALL');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenVerify={onOpenVerify}
              onOpenSubmitProof={onOpenSubmitProof}
              onOpenTaskDetails={onOpenTaskDetails}
              onOpenSendMeetingLink={onOpenSendMeetingLink}
            />
          ))}
        </div>
      )}
    </div>
  );
};

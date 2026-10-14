import React, { useState } from 'react';
import {
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  Send,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Camera,
  Mail,
} from 'lucide-react';
import { Task } from '../types';
import { useTasks } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { EditAvatarModal } from './EditAvatarModal';

interface DoerPortalProps {
  onOpenVerify: (task: Task) => void;
  onOpenSubmitProof: (task: Task) => void;
  onOpenTaskDetails: (task: Task) => void;
  onOpenCreateTask: () => void;
  onOpenScorecards: () => void;
  onOpenSendMeetingLink: (task: Task) => void;
}

export const DoerPortal: React.FC<DoerPortalProps> = ({
  onOpenVerify,
  onOpenSubmitProof,
  onOpenTaskDetails,
  onOpenCreateTask,
  onOpenScorecards,
  onOpenSendMeetingLink,
}) => {
  const { currentUser, tasks, doerScorecards } = useTasks();

  const [activeTab, setActiveTab] = useState<'PRIMARY' | 'BACKUP' | 'VERIFIED'>('PRIMARY');
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);

  // Filter tasks for this specific doer
  const primaryTasks = tasks.filter((t) => t.primaryDoerId === currentUser.id);
  const secondaryTasks = tasks.filter(
    (t) => t.secondaryDoerId === currentUser.id || t.subSecondaryDoerId === currentUser.id
  );
  const myCompletedTasks = primaryTasks.filter((t) => t.status === 'VERIFIED_DONE');

  // Find tasks that need urgent correction
  const tasksNeedingCorrection = primaryTasks.filter((t) => t.status === 'NEEDS_CORRECTION');

  // Find tasks currently awaiting owner verification
  const tasksAwaitingReview = primaryTasks.filter((t) => t.status === 'SUBMITTED_FOR_VERIFICATION');

  // Find delegated meeting tasks where meeting link has not yet been dispatched by this primary doer
  const meetingTasksNeedingDispatch = primaryTasks.filter(
    (t) => t.meetingDetails?.isMeeting && !t.meetingDetails.linkDispatched && t.status !== 'VERIFIED_DONE'
  );

  // Find personal scorecard
  const personalScorecard = doerScorecards.find((c) => c.memberId === currentUser.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Doer Profile Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          {/* Avatar with click to edit */}
          <div
            onClick={() => setIsEditAvatarOpen(true)}
            className="relative cursor-pointer group shrink-0"
            title="Click to change your profile photo"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-800 shadow-xl group-hover:ring-indigo-500 transition-all bg-slate-800"
            />
            <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
              <Camera className="w-5 h-5 text-indigo-300 mb-0.5" />
              <span>Change</span>
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white shadow z-10"
              style={{ backgroundColor: currentUser.accentColor }}
            >
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {currentUser.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                {currentUser.department}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentUser.roleTitle} • Assigned Primary & Secondary Workflows
            </p>
            <button
              onClick={() => setIsEditAvatarOpen(true)}
              className="inline-flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Edit Profile Avatar</span>
            </button>
          </div>
        </div>

        {/* Accountability Score Meter */}
        {personalScorecard && (
          <div className="flex items-center space-x-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Accountability Index
              </span>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {personalScorecard.overallAccountabilityScore}%
              </div>
              <span className="text-[10px] text-emerald-400 block font-medium">
                {personalScorecard.firstAttemptApprovalRate}% 1st-try approval
              </span>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Verified</span>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {personalScorecard.totalCompletedAndVerified}
              </div>
              <span className="text-[10px] text-slate-500 block">completed</span>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <button
              onClick={onOpenScorecards}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs"
              title="View full scoreboard"
            >
              <Award className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        )}
      </div>

      {/* Strict Privacy & Role Isolation Notice */}
      <div className="bg-slate-900/40 border border-slate-800/80 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Employee Workspace Privacy:</strong> Only tasks assigned to you as Primary, Secondary, or Sub-Secondary are shown here. Other team members' private tasks are not visible to your account.
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold whitespace-nowrap hidden sm:inline">
          {primaryTasks.length + secondaryTasks.length} Assigned Tasks
        </span>
      </div>

      {/* URGENT CORRECTION NOTIFICATION BANNER (The Core User Flow!) */}
      {tasksNeedingCorrection.length > 0 && (
        <div className="p-5 rounded-2xl bg-linear-to-r from-amber-950/40 via-red-950/20 to-amber-950/30 border border-amber-500/50 shadow-xl shadow-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>
                ACTION REQUIRED: You have {tasksNeedingCorrection.length} task correction notification(s) from the Owner!
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Urgent Revision
            </span>
          </div>

          {tasksNeedingCorrection.map((t) => (
            <div
              key={t.id}
              className="bg-slate-950/90 p-4 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{t.title}</h4>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-semibold text-amber-300">Owner Feedback: </span>
                  "{t.latestCorrection?.feedback || 'Please update your proof and resubmit.'}"
                </p>
                {t.latestCorrection?.specificIssues && t.latestCorrection.specificIssues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.latestCorrection.specificIssues.map((issue, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        ⚠️ {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onOpenSubmitProof(t)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30 flex items-center space-x-1.5 self-start sm:self-auto transition-transform hover:scale-[1.02]"
              >
                <span>Fix & Resubmit Proof</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PENDING MEETING LINK DISPATCH BANNER (Primary Doer Action Required!) */}
      {meetingTasksNeedingDispatch.length > 0 && (
        <div className="p-5 rounded-2xl bg-linear-to-r from-indigo-950/50 via-purple-950/40 to-slate-900 border border-indigo-500/50 shadow-xl shadow-indigo-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-indigo-300 font-bold text-sm">
              <Mail className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>
                ACTION REQUIRED: You have {meetingTasksNeedingDispatch.length} delegated meeting task(s) awaiting meeting link email dispatch!
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              Dispatch on Mail
            </span>
          </div>

          {meetingTasksNeedingDispatch.map((t) => (
            <div
              key={t.id}
              className="bg-slate-950/90 p-4 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    {t.meetingDetails?.meetingTypeLabel || 'Meeting'}
                  </span>
                  <h4 className="text-sm font-bold text-white">{t.title}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  As Primary Host, send the video meeting link to Secondary & Sub-Sec attendees on their email:{' '}
                  <span className="text-indigo-300 font-mono font-semibold">
                    {t.meetingDetails?.recipientEmails.join(', ')}
                  </span>
                </p>
              </div>

              <button
                onClick={() => onOpenSendMeetingLink(t)}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 self-start sm:self-auto transition-transform hover:scale-[1.02] whitespace-nowrap"
              >
                <Mail className="w-4 h-4" />
                <span>Send Meeting Link on Mail</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveTab('PRIMARY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'PRIMARY'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>My Primary Responsibilities</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-white font-mono">
            {primaryTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'BACKUP'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Secondary / Backup Roles</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {secondaryTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFIED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'VERIFIED'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Verified Done</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {myCompletedTasks.length}
          </span>
        </button>
      </div>

      {/* Task Grid based on Active Tab */}
      <div>
        {activeTab === 'PRIMARY' && (
          primaryTasks.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">All Primary Tasks Cleared!</h3>
              <p className="text-xs text-slate-500">
                You have no active tasks pending primary execution right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {primaryTasks.map((task) => (
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
          )
        )}

        {activeTab === 'BACKUP' && (
          secondaryTasks.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
              <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Secondary Delegations</h3>
              <p className="text-xs text-slate-500">
                You are not currently designated as backup or reviewer for any active tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {secondaryTasks.map((task) => (
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
          )
        )}

        {activeTab === 'VERIFIED' && (
          myCompletedTasks.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-slate-400">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Verified Tasks Yet</h3>
              <p className="text-xs text-slate-500">
                Submit completion proofs on active tasks to earn verification badges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myCompletedTasks.map((task) => (
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
          )
        )}
      </div>

      {/* Edit Avatar Modal */}
      {isEditAvatarOpen && (
        <EditAvatarModal
          user={currentUser}
          onClose={() => setIsEditAvatarOpen(false)}
        />
      )}
    </div>
  );
};

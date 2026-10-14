import React from 'react';
import {
  Repeat,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CheckSquare,
  Shield,
  UserCheck,
  User,
  ArrowRight,
  ExternalLink,
  Flame,
  Award,
  Eye,
  Video,
  Mail,
  Calendar,
  Check,
} from 'lucide-react';
import { Task, TeamMember } from '../types';
import { useTasks } from '../context/TaskContext';

interface TaskCardProps {
  task: Task;
  onOpenVerify: (task: Task) => void;
  onOpenSubmitProof: (task: Task) => void;
  onOpenTaskDetails: (task: Task) => void;
  onOpenSendMeetingLink?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenVerify,
  onOpenSubmitProof,
  onOpenTaskDetails,
  onOpenSendMeetingLink,
}) => {
  const { teamMembers, currentUser } = useTasks();

  const primaryDoer = teamMembers.find((m) => m.id === task.primaryDoerId);
  const secondaryDoer = teamMembers.find((m) => m.id === task.secondaryDoerId);
  const subSecondaryDoer = teamMembers.find((m) => m.id === task.subSecondaryDoerId);

  const isAssignedToCurrent =
    currentUser.id === task.primaryDoerId ||
    currentUser.id === task.secondaryDoerId ||
    currentUser.id === task.subSecondaryDoerId;

  const isPrimary = currentUser.id === task.primaryDoerId;

  const completedChecklist = task.checklist.filter((c) => c.completed).length;
  const totalChecklist = task.checklist.length;
  const progressPercent = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

  // Status badge renderer
  const renderStatusBadge = () => {
    switch (task.status) {
      case 'SUBMITTED_FOR_VERIFICATION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Awaiting Verification</span>
          </span>
        );
      case 'NEEDS_CORRECTION':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Needs Correction</span>
          </span>
        );
      case 'VERIFIED_DONE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified & Done</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <span>Pending</span>
          </span>
        );
    }
  };

  // Priority color
  const getPriorityBadge = () => {
    switch (task.priority) {
      case 'URGENT':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        task.status === 'SUBMITTED_FOR_VERIFICATION'
          ? 'bg-linear-to-b from-purple-950/20 via-slate-900 to-slate-900/90 border-purple-500/40 shadow-lg shadow-purple-900/10 hover:border-purple-400/60'
          : task.status === 'NEEDS_CORRECTION'
          ? 'bg-linear-to-b from-amber-950/25 via-slate-900 to-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-900/10 hover:border-amber-400/60'
          : task.status === 'VERIFIED_DONE'
          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Top Banner for Needs Correction or Awaiting Verification */}
      {task.status === 'NEEDS_CORRECTION' && task.latestCorrection && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-snug">
            <span className="font-bold text-amber-300">Owner Feedback: </span>
            <span className="line-clamp-2">{task.latestCorrection.feedback}</span>
          </div>
        </div>
      )}

      {task.status === 'SUBMITTED_FOR_VERIFICATION' && currentUser.isOwner && (
        <div className="bg-purple-500/15 border-b border-purple-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-purple-200">
          <span className="flex items-center space-x-1.5 font-semibold">
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>Inspection Required: Proof submitted by {primaryDoer?.name}</span>
          </span>
          <span className="text-[10px] bg-purple-500/30 px-2 py-0.5 rounded font-mono">
            Attempt #{task.currentSubmission?.submissionAttempt || 1}
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Header Tags: Type & Priority */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {task.type === 'RECURRING' ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Repeat className="w-3 h-3 text-cyan-400" />
                <span>{task.recurrence?.frequency || 'RECURRING'} SOP</span>
                {task.recurrence?.streakCount ? (
                  <span className="flex items-center space-x-0.5 ml-1 text-amber-400 text-[10px]">
                    <Flame className="w-3 h-3" />
                    <span>{task.recurrence.streakCount}</span>
                  </span>
                ) : null}
              </span>
            ) : task.meetingDetails?.isMeeting ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/40">
                <Video className="w-3 h-3 text-purple-400" />
                <span>{task.meetingDetails.meetingTypeLabel || 'MEETING'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                <Send className="w-3 h-3 text-indigo-400" />
                <span>DELEGATION</span>
              </span>
            )}

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge()}`}
            >
              {task.priority}
            </span>
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenTaskDetails(task)}
          className="text-base font-bold text-white mb-2 leading-snug hover:text-indigo-300 cursor-pointer transition-colors"
        >
          {task.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>

        {/* Meeting Information & Email Dispatch Bar */}
        {task.meetingDetails?.isMeeting && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{task.meetingDetails.scheduledDate || 'Scheduled'}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{task.meetingDetails.scheduledTime || '10:00 AM'}</span>
              </div>

              {task.meetingDetails.linkDispatched ? (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                  <span>Link Sent on Mail</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                  <Mail className="w-3 h-3" />
                  <span>Pending Link Dispatch</span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-indigo-500/20">
              <span className="truncate">
                ✉️ To: <strong className="text-slate-300 font-mono">{secondaryDoer?.email || 'Secondary'}, {subSecondaryDoer?.email || 'Sub-Sec'}</strong>
              </span>
              {onOpenSendMeetingLink && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSendMeetingLink(task);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center space-x-1 shrink-0 ml-2"
                >
                  <Mail className="w-3 h-3" />
                  <span>{task.meetingDetails.linkDispatched ? 'Resend' : 'Send Link'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Proof Thumbnail if submitted */}
        {task.currentSubmission?.imageUrl && (
          <div
            onClick={() => (currentUser.isOwner ? onOpenVerify(task) : onOpenTaskDetails(task))}
            className="mb-4 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 cursor-pointer group/img"
          >
            <div className="h-28 w-full overflow-hidden relative">
              <img
                src={task.currentSubmission.imageUrl}
                alt="Submitted proof"
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                <span className="font-medium truncate drop-shadow">
                  📷 {task.currentSubmission.imageCaption || 'Proof Screenshot'}
                </span>
                <span className="text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/80">
                  Click to inspect
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Verification Success Badge */}
        {task.status === 'VERIFIED_DONE' && task.verificationRecord && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
              <span className="flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified by {task.verificationRecord.verifiedByOwnerName}</span>
              </span>
              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                +{task.verificationRecord.awardedScore} pts
              </span>
            </div>
            {task.verificationRecord.ownerNotes && (
              <p className="text-[11px] text-slate-300 italic">
                "{task.verificationRecord.ownerNotes}"
              </p>
            )}
          </div>
        )}

        {/* Checklist progress */}
        {totalChecklist > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Verification Checklist</span>
              </span>
              <span className="font-mono text-slate-300">
                {completedChecklist}/{totalChecklist} ({Math.round(progressPercent)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 3-Tier Delegation Chain (The User's Core Requirement) */}
        <div className="mt-auto pt-3 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Delegation Hierarchy (3 Doers)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Primary Doer */}
            <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 flex items-center space-x-2">
              <div className="relative">
                <img
                  src={primaryDoer?.avatar}
                  alt={primaryDoer?.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500"
                />
                <span
                  className="absolute -top-1 -left-1 bg-indigo-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow"
                  title="Primary Doer (Main Execution)"
                >
                  P
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 block">
                  Primary
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate block">
                  {primaryDoer?.name?.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Secondary Doer */}
            <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 flex items-center space-x-2">
              <div className="relative">
                <img
                  src={secondaryDoer?.avatar}
                  alt={secondaryDoer?.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                />
                <span
                  className="absolute -top-1 -left-1 bg-slate-700 text-slate-200 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow"
                  title="Secondary Doer (Backup / Review)"
                >
                  S
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Secondary
                </span>
                <span className="text-xs font-medium text-slate-300 truncate block">
                  {secondaryDoer?.name?.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Sub-Secondary Doer */}
            <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 flex items-center space-x-2">
              <div className="relative">
                <img
                  src={subSecondaryDoer?.avatar}
                  alt={subSecondaryDoer?.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                />
                <span
                  className="absolute -top-1 -left-1 bg-slate-800 text-slate-400 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow"
                  title="Sub-Secondary Doer (Escalation)"
                >
                  3
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 block">
                  Sub-Sec
                </span>
                <span className="text-xs font-medium text-slate-400 truncate block">
                  {subSecondaryDoer?.name?.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="text-[11px] text-slate-400 flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Send Meeting Link on Mail Action */}
          {task.meetingDetails?.isMeeting && onOpenSendMeetingLink && (isPrimary || currentUser.isOwner) && (
            <button
              onClick={() => onOpenSendMeetingLink(task)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                task.meetingDetails.linkDispatched
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-950/30 animate-pulse'
              }`}
              title="Send video meeting link to Secondary & Sub-Sec doers on mail"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>{task.meetingDetails.linkDispatched ? 'Resend Mail' : 'Send Link on Mail'}</span>
            </button>
          )}

          {/* Action button conditional on Role & Status */}
          {currentUser.isOwner ? (
            task.status === 'SUBMITTED_FOR_VERIFICATION' ? (
              <button
                onClick={() => onOpenVerify(task)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Verify Task</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenTaskDetails(task)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            // For Doers:
            task.status === 'NEEDS_CORRECTION' && isAssignedToCurrent ? (
              <button
                onClick={() => onOpenSubmitProof(task)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-600/30 transition-all hover:scale-[1.02]"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Fix & Resubmit</span>
              </button>
            ) : task.status === 'SUBMITTED_FOR_VERIFICATION' ? (
              <button
                onClick={() => onOpenTaskDetails(task)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 bg-purple-950/40 border border-purple-500/30"
              >
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Under Review</span>
              </button>
            ) : task.status !== 'VERIFIED_DONE' && isAssignedToCurrent ? (
              <button
                onClick={() => onOpenSubmitProof(task)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Proof</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenTaskDetails(task)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

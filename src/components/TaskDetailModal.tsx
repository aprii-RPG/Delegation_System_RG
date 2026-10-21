import React, { useState } from 'react';
import {
  X,
  Repeat,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Users,
  Shield,
  Activity,
  Award,
  Check,
  ZoomIn,
  ExternalLink,
  Video,
  Mail,
  Copy,
  Download,
} from 'lucide-react';
import { Task } from '../types';
import { useTasks } from '../context/TaskContext';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onOpenVerify: (task: Task) => void;
  onOpenSubmitProof: (task: Task) => void;
  onOpenSendMeetingLink?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onOpenVerify,
  onOpenSubmitProof,
  onOpenSendMeetingLink,
}) => {
  const { teamMembers, currentUser, toggleChecklistItem } = useTasks();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBMISSIONS' | 'AUDIT_LOG'>('OVERVIEW');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const primaryDoer = teamMembers.find((m) => m.id === task.primaryDoerId);
  const secondaryDoer = teamMembers.find((m) => m.id === task.secondaryDoerId);
  const subSecondaryDoer = teamMembers.find((m) => m.id === task.subSecondaryDoerId);

  const isAssigned =
    currentUser.id === task.primaryDoerId ||
    currentUser.id === task.secondaryDoerId ||
    currentUser.id === task.subSecondaryDoerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {task.type === 'RECURRING' ? <Repeat className="w-5 h-5 text-cyan-400" /> : <Send className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {task.type === 'RECURRING' ? 'RECURRING SOP' : 'DELEGATED WORK'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {task.priority}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  {task.category}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white truncate max-w-xl">
                {task.title}
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
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Requirements
          </button>
          <button
            onClick={() => setActiveTab('SUBMISSIONS')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'SUBMISSIONS'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Proof Submissions</span>
            {task.submissionHistory.length > 0 && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                {task.submissionHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOG')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'AUDIT_LOG'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail ({task.activityLogs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {activeTab === 'OVERVIEW' && (
            <>
              {/* Alert if correction requested */}
              {task.status === 'NEEDS_CORRECTION' && task.latestCorrection && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <div className="flex items-center space-x-2 font-bold text-amber-300 text-sm mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Correction Feedback from {task.latestCorrection.requestedByOwnerName}:</span>
                  </div>
                  <p className="bg-amber-950/40 p-3 rounded-lg border border-amber-500/20 text-slate-100 font-medium">
                    "{task.latestCorrection.feedback}"
                  </p>
                </div>
              )}

              {/* Verified Stamped Banner */}
              {task.status === 'VERIFIED_DONE' && task.verificationRecord && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
                  <div className="flex items-center justify-between font-bold text-emerald-300 text-sm mb-1">
                    <span className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Verified & Done by {task.verificationRecord.verifiedByOwnerName}</span>
                    </span>
                    <span className="font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs">
                      +{task.verificationRecord.awardedScore} Quality Pts
                    </span>
                  </div>
                  <p className="text-slate-300 italic">
                    "{task.verificationRecord.ownerNotes}"
                  </p>
                </div>
              )}

              {/* Meeting Conference & Dispatch Block */}
              {task.meetingDetails?.isMeeting && (
                <div className="bg-linear-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 p-5 rounded-2xl border border-indigo-500/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider font-mono">
                            MEETING WORKFLOW
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                            {task.meetingDetails.meetingTypeLabel || 'Meeting'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          {task.meetingDetails.meetingTypeLabel || 'Meeting'} Session Configuration
                        </h4>
                      </div>
                    </div>

                    {/* Dispatch status */}
                    <div>
                      {task.meetingDetails.linkDispatched ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Meeting Link Dispatched on Mail</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pending Primary Doer Link Dispatch</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scheduled time & link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Schedule</span>
                      <div className="flex items-center space-x-3 mt-1 text-slate-200 font-semibold">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{task.meetingDetails.scheduledDate || 'Not set'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{task.meetingDetails.scheduledTime || '10:00 AM'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Video Link</span>
                        <span className="text-xs text-indigo-300 font-mono font-medium block truncate mt-1">
                          {task.meetingDetails.meetingLink || 'No link created'}
                        </span>
                      </div>
                      {task.meetingDetails.meetingLink && (
                        <a
                          href={task.meetingDetails.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Join</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Designated Recipients */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        Secondary & Sub-Sec Doer Emails (Mail Recipients):
                      </span>
                      <span className="text-xs text-emerald-300 font-mono font-bold mt-0.5 block">
                        {task.meetingDetails.recipientEmails?.join(', ') || 'None specified'}
                      </span>
                    </div>

                    {onOpenSendMeetingLink && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSendMeetingLink(task);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all self-start sm:self-auto whitespace-nowrap"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{task.meetingDetails.linkDispatched ? 'Resend Link on Mail' : 'Send Meeting Link on Mail'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Task Description */}
              <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Task Brief & Success Criteria
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {task.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {task.attachments && task.attachments.length > 0 && (
                <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Task Files & Images ({task.attachments.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {task.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 min-w-0"
                      >
                        {attachment.type.startsWith('image/') ? (
                          <img
                            src={attachment.dataUrl}
                            alt={attachment.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-indigo-400 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-slate-200 truncate">
                            {attachment.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {(attachment.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                        <a
                          href={attachment.dataUrl}
                          download={attachment.name}
                          aria-label={`Download ${attachment.name}`}
                          className="p-2 rounded-lg text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3-Tier Delegation Structure */}
              <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  The 3-Tier Delegation Hierarchy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-indigo-500/30 flex items-center space-x-3">
                    <img
                      src={primaryDoer?.avatar}
                      alt={primaryDoer?.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500"
                    />
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                        Primary Doer (Main)
                      </span>
                      <span className="text-sm font-bold text-white block">{primaryDoer?.name}</span>
                      <span className="text-[11px] text-slate-400 block">{primaryDoer?.roleTitle}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
                    <img
                      src={secondaryDoer?.avatar}
                      alt={secondaryDoer?.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                        Secondary Doer (Backup)
                      </span>
                      <span className="text-sm font-bold text-slate-200 block">{secondaryDoer?.name}</span>
                      <span className="text-[11px] text-slate-400 block">{secondaryDoer?.roleTitle}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-3">
                    <img
                      src={subSecondaryDoer?.avatar}
                      alt={subSecondaryDoer?.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        Sub-Secondary Doer (Escalation)
                      </span>
                      <span className="text-sm font-bold text-slate-300 block">{subSecondaryDoer?.name}</span>
                      <span className="text-[11px] text-slate-400 block">{subSecondaryDoer?.roleTitle}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              {task.checklist.length > 0 && (
                <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Verification Checklist ({task.checklist.filter((c) => c.completed).length}/
                      {task.checklist.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {task.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklistItem(task.id, item.id)}
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs ${
                          item.completed
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                            item.completed ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 font-bold" />}
                        </div>
                        <span className={item.completed ? 'font-medium line-through text-slate-400' : 'text-slate-200'}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'SUBMISSIONS' && (
            <div className="space-y-4">
              {task.submissionHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No proof submissions logged yet for this task.</p>
                </div>
              ) : (
                task.submissionHistory.map((sub, idx) => {
                  const submitterMember = teamMembers.find((m) => m.id === sub.submittedByMemberId);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={submitterMember?.avatar}
                            alt={submitterMember?.name}
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {submitterMember?.name} ({sub.submittedByRole})
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {new Date(sub.submittedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                          Attempt #{sub.submissionAttempt}
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 bg-slate-900 p-3.5 rounded-lg border border-slate-800/80 leading-relaxed whitespace-pre-line">
                        {sub.description}
                      </div>

                      {sub.imageUrl && (
                        <div className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                            <img
                              src={sub.imageUrl}
                              alt="Proof"
                              className="w-full max-h-72 object-contain bg-slate-950/90"
                            />
                            <button
                              onClick={() => setZoomedImage(sub.imageUrl || null)}
                              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800 text-xs flex items-center space-x-1"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Zoom</span>
                            </button>
                          </div>
                          {sub.imageCaption && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              Caption: {sub.imageCaption}
                            </p>
                          )}
                        </div>
                      )}

                      {sub.attachmentUrl && (
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-400">Resource:</span>
                          <a
                            href={sub.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline flex items-center space-x-1"
                          >
                            <span>{sub.attachmentName || 'Attached Link'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'AUDIT_LOG' && (
            <div className="space-y-3">
              {task.activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">
                        {log.actorName} ({log.action})
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Task ID: <span className="font-mono text-slate-400">{task.id}</span>
          </span>

          <div className="flex items-center space-x-3">
            {currentUser.isOwner && task.status === 'SUBMITTED_FOR_VERIFICATION' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenVerify(task);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
              >
                Inspect & Verify Proof
              </button>
            )}

            {!currentUser.isOwner && isAssigned && task.status !== 'VERIFIED_DONE' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSubmitProof(task);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
              >
                {task.status === 'NEEDS_CORRECTION' ? 'Fix & Resubmit Proof' : 'Submit Proof'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Fullscreen"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

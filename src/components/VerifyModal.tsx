import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  User,
  ShieldCheck,
  ZoomIn,
  MessageSquare,
  FileText,
  Check,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Task, TeamMember } from '../types';
import { useTasks } from '../context/TaskContext';

interface VerifyModalProps {
  task: Task;
  onClose: () => void;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({ task, onClose }) => {
  const { teamMembers, verifyTask, requestCorrection } = useTasks();

  const [mode, setMode] = useState<'INSPECT' | 'CORRECTION_FORM'>('INSPECT');
  const [ownerNote, setOwnerNote] = useState('');
  const [correctionFeedback, setCorrectionFeedback] = useState('');
  const [correctionTags, setCorrectionTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primaryDoer = teamMembers.find((m) => m.id === task.primaryDoerId);
  const secondaryDoer = teamMembers.find((m) => m.id === task.secondaryDoerId);
  const subSecondaryDoer = teamMembers.find((m) => m.id === task.subSecondaryDoerId);

  const submission = task.currentSubmission || task.submissionHistory[task.submissionHistory.length - 1];
  const submitter = teamMembers.find((m) => m.id === submission?.submittedByMemberId) || primaryDoer;

  // Preset correction quick tags
  const QUICK_CORRECTION_TAGS = [
    'Missing invoice receipt / voucher proof',
    'Numbers do not match bank statement',
    'Resolution metrics lack timestamp confirmation',
    'Incomplete checklist criteria',
    'Image proof is blurry or cut off',
    'Secondary review sign-off missing',
  ];

  const handleToggleTag = (tag: string) => {
    if (correctionTags.includes(tag)) {
      setCorrectionTags(correctionTags.filter((t) => t !== tag));
    } else {
      setCorrectionTags([...correctionTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !correctionTags.includes(customTagInput.trim())) {
      setCorrectionTags([...correctionTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  // Perform Verification
  const handleVerify = () => {
    setIsSubmitting(true);
    verifyTask(task.id, ownerNote.trim() || 'Verified by Owner. All criteria fulfilled.');
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  // Perform Request Correction
  const handleSendCorrection = () => {
    if (!correctionFeedback.trim() && correctionTags.length === 0) {
      alert('Please provide correction feedback or select at least one issue point so the doer knows what to fix.');
      return;
    }

    setIsSubmitting(true);
    const fullFeedback = correctionFeedback.trim() || 'Please address the specified checklist issues and resubmit proof.';
    requestCorrection(task.id, fullFeedback, correctionTags);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  EXECUTIVE INSPECTION & VERIFICATION PANEL
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Attempt #{submission?.submissionAttempt || 1}
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

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {mode === 'INSPECT' ? (
            <>
              {/* Task Specs & Delegation Context */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Assigned Delegation Chain</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-indigo-400 font-semibold">Primary: {primaryDoer?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Backup: {secondaryDoer?.name} • Sub: {subSecondaryDoer?.name}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Task Type & Priority</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200">
                      {task.type === 'RECURRING' ? 'Recurring SOP' : 'Ad-hoc Delegation'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Due: {new Date(task.dueDate).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Submitted By</span>
                  <div className="flex items-center space-x-2">
                    <img
                      src={submitter?.avatar}
                      alt={submitter?.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <span className="font-semibold text-white">{submitter?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Just now'}
                  </div>
                </div>
              </div>

              {/* SECTION: What the Doer Actually Did (Description) */}
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Doer's Completion Summary & Description
                    </h3>
                  </div>
                  {submission?.timeSpentMinutes && (
                    <span className="flex items-center space-x-1 text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{Math.floor(submission.timeSpentMinutes / 60)}h {submission.timeSpentMinutes % 60}m logged</span>
                    </span>
                  )}
                </div>

                <div className="bg-slate-900/90 rounded-lg p-4 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {submission?.description || 'No description provided by the doer.'}
                </div>

                {submission?.attachmentUrl && (
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Attached Resource:</span>
                    <a
                      href={submission.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                    >
                      <span>{submission.attachmentName || 'View Document Link'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* SECTION: Image Proof (Visual Verification) */}
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Submitted Image Proof & Visual Evidence
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Verify image authenticity and data clarity
                  </span>
                </div>

                {submission?.imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                      <img
                        src={submission.imageUrl}
                        alt="Proof of work"
                        className="w-full max-h-[380px] object-contain bg-slate-950/90 transition-transform duration-200"
                      />
                      <button
                        onClick={() => setIsImageZoomed(true)}
                        className="absolute bottom-3 right-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold backdrop-blur-md border border-slate-700 shadow-lg transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Zoom Fullscreen</span>
                      </button>
                    </div>

                    {submission.imageCaption && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 font-medium flex items-center space-x-2">
                        <span className="text-slate-500 font-mono text-[11px]">CAPTION:</span>
                        <span>{submission.imageCaption}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <span>No image proof was attached to this submission.</span>
                  </div>
                )}
              </div>

              {/* SECTION: Checklist Review */}
              {task.checklist.length > 0 && (
                <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5">
                  <h3 className="text-sm font-bold text-white mb-3">
                    Verified Checklist Verification ({task.checklist.filter(c => c.completed).length}/{task.checklist.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {task.checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center space-x-2 ${
                          item.completed
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            item.completed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                        <span className={item.completed ? 'font-medium' : ''}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Owner Verification Note */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Owner's Approval Note (Optional, added to audit trail & scorecard)
                </label>
                <input
                  type="text"
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  placeholder="e.g. Excellent attention to detail. Verified and approved with 100% compliance."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </>
          ) : (
            /* MODE: CORRECTION FORM */
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm mb-1">
                    Requesting Task Correction from {primaryDoer?.name}
                  </h4>
                  <p className="leading-relaxed">
                    When you submit this correction request, the task will revert to <strong>Needs Correction</strong>. The doer will receive an immediate high-priority notification with your feedback to fix their work and resubmit proof.
                  </p>
                </div>
              </div>

              {/* Quick Issue Checkbox Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Specific Issues (Click to toggle):
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CORRECTION_TAGS.map((tag) => {
                    const isSelected = correctionTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-semibold shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Issue Input */}
                <div className="mt-3 flex space-x-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                    placeholder="Or type a custom issue point..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
                  >
                    Add Point
                  </button>
                </div>
              </div>

              {/* Detailed Feedback Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Detailed Correction Instructions & Feedback: <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={correctionFeedback}
                  onChange={(e) => setCorrectionFeedback(e.target.value)}
                  placeholder="Explain clearly what was wrong or missing and what exact changes are required before this task can be approved..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          {mode === 'INSPECT' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('CORRECTION_FORM')}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Task Needs Correction</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleVerify}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? 'Verifying...' : 'Verify & Mark as Done'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode('INSPECT')}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Back to Inspection
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendCorrection}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'Sending Request...' : 'Send Correction to Doer'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {isImageZoomed && submission?.imageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            onClick={() => setIsImageZoomed(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={submission.imageUrl}
            alt="Fullscreen proof"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
          />
          <p className="text-white text-xs mt-3 bg-black/60 px-4 py-1.5 rounded-full border border-white/20">
            {submission.imageCaption || 'Task Proof of Completion'} • Click anywhere to exit
          </p>
        </div>
      )}
    </div>
  );
};

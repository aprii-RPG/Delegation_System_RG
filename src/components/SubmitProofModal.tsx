import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Link as LinkIcon,
  Sparkles,
  FileText,
  Send,
  Trash2,
  Check,
} from 'lucide-react';
import { Task } from '../types';
import { useTasks } from '../context/TaskContext';
import { SAMPLE_IMAGE_PROOFS } from '../data/initialData';

interface SubmitProofModalProps {
  task: Task;
  onClose: () => void;
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({ task, onClose }) => {
  const { submitTaskProof, currentUser } = useTasks();

  const isResubmission = task.status === 'NEEDS_CORRECTION';
  const latestCorrection = task.latestCorrection;

  const [description, setDescription] = useState(
    isResubmission
      ? `Updated and resolved issues requested by owner: ${latestCorrection?.feedback ? `Addressing: "${latestCorrection.feedback.slice(0, 60)}..."` : ''}`
      : ''
  );
  const [imageUrl, setImageUrl] = useState<string>(
    task.currentSubmission?.imageUrl || SAMPLE_IMAGE_PROOFS[0].url
  );
  const [imageCaption, setImageCaption] = useState<string>(
    task.currentSubmission?.imageCaption || 'Verified completion proof screenshot'
  );
  const [attachmentUrl, setAttachmentUrl] = useState<string>(
    task.currentSubmission?.attachmentUrl || ''
  );
  const [attachmentName, setAttachmentName] = useState<string>(
    task.currentSubmission?.attachmentName || ''
  );
  const [timeSpentMinutes, setTimeSpentMinutes] = useState<number>(
    task.currentSubmission?.timeSpentMinutes || 90
  );
  const [checkedItems, setCheckedItems] = useState<string[]>(
    task.checklist.map((c) => c.id) // Pre-check all to encourage full completion
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setImageCaption(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleChecklist = (id: string) => {
    if (checkedItems.includes(id)) {
      setCheckedItems(checkedItems.filter((i) => i !== id));
    } else {
      setCheckedItems([...checkedItems, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please write a short description of the work you performed.');
      return;
    }

    setIsSubmitting(true);
    submitTaskProof(task.id, {
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
      attachmentName: attachmentName.trim() || (attachmentUrl ? 'Project Document' : undefined),
      timeSpentMinutes: Number(timeSpentMinutes) || 60,
      checklistCompleted: checkedItems,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isResubmission
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {isResubmission ? <AlertTriangle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isResubmission ? 'text-amber-400' : 'text-indigo-400'
                  }`}
                >
                  {isResubmission ? 'CORRECTION RE-SUBMISSION' : 'SUBMIT WORK FOR OWNER VERIFICATION'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {currentUser.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* If Resubmitting: Show Owner's Correction Feedback Alert */}
          {isResubmission && latestCorrection && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Owner Correction Instructions:</span>
              </div>
              <p className="bg-amber-950/40 p-3 rounded-lg border border-amber-500/20 text-slate-100 font-medium leading-relaxed">
                "{latestCorrection.feedback}"
              </p>
              {latestCorrection.specificIssues?.length > 0 && (
                <div className="pt-1">
                  <span className="font-semibold text-amber-300 block mb-1">
                    Specific points to resolve:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200">
                    {latestCorrection.specificIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Work Completion Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-2">
              Detailed Work Summary / Completion Description <span className="text-indigo-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specifically what you did, which steps were completed, results achieved, and any findings the owner should verify..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Image Proof Upload Section */}
          <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <label className="text-xs font-bold text-white">
                  Image Proof of Work (Required for Verification)
                </label>
              </div>
              <span className="text-[11px] text-slate-400">
                Screenshot, photo receipt, or metric snapshot
              </span>
            </div>

            {/* Current Image Preview */}
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                <img
                  src={imageUrl}
                  alt="Proof preview"
                  className="w-full max-h-56 object-contain bg-slate-950/80"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Dropzone / Upload area */
              <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 transition-colors">
                <Upload className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  Upload screenshot or proof photo
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports PNG, JPG, WebP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Quick Demo Image Presets (Convenience for testing!) */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                Or pick a quick demo proof preset:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_IMAGE_PROOFS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(sample.url);
                      setImageCaption(sample.caption);
                    }}
                    className={`p-2 rounded-lg border text-left text-[11px] transition-all flex flex-col justify-between h-16 ${
                      imageUrl === sample.url
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate block font-medium">{sample.label}</span>
                    <span className="text-[9px] text-slate-500 block">Preset #{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Caption */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Image Caption / Evidence Title
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="e.g. Datadog Production Cluster Health Monitor - Grade A+"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Checklist Verification Items */}
          {task.checklist.length > 0 && (
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Confirm Checklist Requirements:
              </label>
              <div className="space-y-2">
                {task.checklist.map((item) => {
                  const isChecked = checkedItems.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={isChecked ? 'font-medium' : ''}>{item.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Spent & External Reference Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Time Spent on Execution
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={timeSpentMinutes}
                  onChange={(e) => setTimeSpentMinutes(Number(e.target.value))}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">
                  minutes ({Math.floor(timeSpentMinutes / 60)}h {timeSpentMinutes % 60}m)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                External Link or Resource URL (Optional)
              </label>
              <input
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://drive.google.com/... or PR link"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isResubmission
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Submitting...'
                  : isResubmission
                  ? 'Re-submit for Verification'
                  : 'Submit for Owner Verification'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Video,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  Users,
  Shield,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { Task, TeamMember } from '../types';
import { useTasks } from '../context/TaskContext';

interface SendMeetingLinkModalProps {
  task: Task;
  onClose: () => void;
}

export const SendMeetingLinkModal: React.FC<SendMeetingLinkModalProps> = ({
  task,
  onClose,
}) => {
  const { teamMembers, ownerUser, currentUser, dispatchMeetingLink } = useTasks();

  const primaryDoer = teamMembers.find((m) => m.id === task.primaryDoerId);
  const secondaryDoer = teamMembers.find((m) => m.id === task.secondaryDoerId);
  const subSecondaryDoer = teamMembers.find((m) => m.id === task.subSecondaryDoerId);

  const meetingTypeLabel =
    task.meetingDetails?.meetingTypeLabel || 'Corporate Meeting';

  // Extract designated secondary & sub-sec emails provided during delegation
  const designatedSecondaryEmail =
    task.meetingDetails?.recipientEmails?.[0] || secondaryDoer?.email || 'secondary@enterprise.co';
  const designatedSubSecondaryEmail =
    task.meetingDetails?.recipientEmails?.[1] || subSecondaryDoer?.email || 'subsec@enterprise.co';
  const initialExtraEmails =
    task.meetingDetails?.recipientEmails && task.meetingDetails.recipientEmails.length > 2
      ? task.meetingDetails.recipientEmails.slice(2)
      : [];

  // State for meeting link (initial from task or default Google Meet template)
  const [meetingLink, setMeetingLink] = useState(
    task.meetingDetails?.meetingLink ||
      `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
  );

  // Recipient checkboxes
  const [includeSecondary, setIncludeSecondary] = useState(true);
  const [includeSubSecondary, setIncludeSubSecondary] = useState(true);
  const [includeOwner, setIncludeOwner] = useState(false);
  const [customEmails, setCustomEmails] = useState<string[]>(initialExtraEmails);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Email subject & body
  const [emailSubject, setEmailSubject] = useState(
    task.meetingDetails?.emailSubject ||
      `[${meetingTypeLabel}] Video Conference Link: ${task.title}`
  );

  const defaultBody = `Hello Team,

You are invited to the upcoming ${meetingTypeLabel} for our delegated assignment: "${task.title}".

📅 SCHEDULED TIME:
Date: ${task.meetingDetails?.scheduledDate || new Date(task.dueDate).toLocaleDateString()}
Time: ${task.meetingDetails?.scheduledTime || '10:00 AM'}

🔗 VIDEO MEETING LINK:
${meetingLink}

📋 MEETING OBJECTIVES & AGENDA:
${task.meetingDetails?.agendaNotes || task.description || 'Review agenda items, coordinate operational handoffs, and align deliverables.'}

👥 ATTENDEES & ROLES:
• Primary Host: ${primaryDoer?.name || currentUser.name} (${primaryDoer?.email || currentUser.email})
• Secondary Doer: ${secondaryDoer?.name || 'Assigned'} (${designatedSecondaryEmail})
• Sub-Secondary Doer: ${subSecondaryDoer?.name || 'Assigned'} (${designatedSubSecondaryEmail})

Please review the requirements beforehand and join on time.

Regards,
${currentUser.name}
${currentUser.roleTitle}
DelegateOS Delegation Network`;

  const [emailBody, setEmailBody] = useState(defaultBody);
  const [isCopied, setIsCopied] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchMethodUsed, setDispatchMethodUsed] = useState<string | null>(null);

  // Compute selected recipients based on checkboxes
  const selectedRecipients: string[] = [];
  if (includeSecondary && designatedSecondaryEmail) selectedRecipients.push(designatedSecondaryEmail);
  if (includeSubSecondary && designatedSubSecondaryEmail) selectedRecipients.push(designatedSubSecondaryEmail);
  if (includeOwner && ownerUser.email) selectedRecipients.push(ownerUser.email);
  customEmails.forEach((email) => {
    if (email && !selectedRecipients.includes(email)) selectedRecipients.push(email);
  });

  const handleAddCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmailInput.trim() && newEmailInput.includes('@')) {
      if (!customEmails.includes(newEmailInput.trim())) {
        setCustomEmails([...customEmails, newEmailInput.trim()]);
      }
      setNewEmailInput('');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateNewMeet = () => {
    const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const newUrl = `https://meet.google.com/${code}`;
    setMeetingLink(newUrl);
    // Also update in body
    setEmailBody((prev) => prev.replace(meetingLink, newUrl));
  };

  // 1. OPEN IN DEFAULT EMAIL CLIENT (MAILTO)
  const handleOpenEmailApp = () => {
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient email (Secondary or Sub-Secondary doer).');
      return;
    }

    if (!meetingLink.trim()) {
      alert('Please enter a valid video meeting link.');
      return;
    }

    // Record in system
    dispatchMeetingLink(task.id, {
      meetingLink: meetingLink.trim(),
      recipientEmails: selectedRecipients,
      emailSubject,
      emailBody,
      method: 'MAIL_APP_OPENED',
    });

    // Create mailto link
    const mailtoUrl = `mailto:${selectedRecipients.join(',')}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    window.open(mailtoUrl, '_blank');

    setIsDispatched(true);
    setDispatchMethodUsed('MAIL_APP');
  };

  // 2. DISPATCH & LOG IN SYSTEM DATABASE
  const handleSystemDispatch = () => {
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient email.');
      return;
    }

    if (!meetingLink.trim()) {
      alert('Please enter a valid video meeting link.');
      return;
    }

    dispatchMeetingLink(task.id, {
      meetingLink: meetingLink.trim(),
      recipientEmails: selectedRecipients,
      emailSubject,
      emailBody,
      method: 'DISPATCHED_IN_APP',
    });

    setIsDispatched(true);
    setDispatchMethodUsed('SYSTEM_DISPATCH');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                  PRIMARY DOER EMAIL DISPATCH DOCK
                </span>
                <span className="text-[9px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                  {meetingTypeLabel}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Send Meeting Link to Secondary & Sub-Sec Doers
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner if dispatched */}
        {isDispatched && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  Meeting Link Dispatched & Logged Successfully!
                </h4>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  The meeting link has been sent to {selectedRecipients.length} recipient(s):{' '}
                  <strong className="text-white">{selectedRecipients.join(', ')}</strong>. The task audit log and checklist have been stamped as dispatched.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap"
            >
              Done / Return
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[76vh] overflow-y-auto space-y-6">
          {/* Meeting Summary Banner */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Delegated Assignment
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{task.title}</h4>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {task.meetingDetails?.scheduledDate || new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{task.meetingDetails?.scheduledTime || '10:00 AM'}</span>
                </span>
                <span className="text-indigo-300 font-semibold">
                  Host: {primaryDoer?.name || currentUser.name}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Dispatch Status
              </span>
              {task.meetingDetails?.linkDispatched || isDispatched ? (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Dispatched</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Awaiting Primary Dispatch</span>
                </span>
              )}
            </div>
          </div>

          {/* 1. Meeting Link Input & Quick Tools */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Video Conference Meeting Link</span>
              </label>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleGenerateNewMeet}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>New Google Meet</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                title="Copy Link to Clipboard"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={meetingLink}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center space-x-1 transition-colors"
                title="Test / Open Meeting Link"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Join Test</span>
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Paste your Google Meet, Zoom, or Microsoft Teams room link to share with attendees.
            </p>
          </div>

          {/* 2. Recipient Selectors (Secondary & Sub-Secondary Doer Emails) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Target Recipients (Secondary & Sub-Sec Doers)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select which doers will receive the invitation and meeting link on their corporate email.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIncludeSecondary(true);
                    setIncludeSubSecondary(true);
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30"
                >
                  Select Both
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludeSecondary(true);
                    setIncludeSubSecondary(false);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                >
                  Only Secondary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludeSecondary(false);
                    setIncludeSubSecondary(true);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                >
                  Only Sub-Sec
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludeSecondary(false);
                    setIncludeSubSecondary(false);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Secondary Doer Checkbox */}
              <label
                className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                  includeSecondary
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeSecondary}
                  onChange={(e) => setIncludeSecondary(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {secondaryDoer?.name || 'Secondary Doer'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                      SECONDARY
                    </span>
                  </div>
                  <span className="text-xs font-mono text-indigo-300 block truncate font-medium">
                    {designatedSecondaryEmail}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {secondaryDoer?.roleTitle}
                  </span>
                </div>
              </label>

              {/* Sub-Secondary Doer Checkbox */}
              <label
                className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                  includeSubSecondary
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-900 border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeSubSecondary}
                  onChange={(e) => setIncludeSubSecondary(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {subSecondaryDoer?.name || 'Sub-Secondary Doer'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono font-bold">
                      SUB-SEC
                    </span>
                  </div>
                  <span className="text-xs font-mono text-indigo-300 block truncate font-medium">
                    {designatedSubSecondaryEmail}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {subSecondaryDoer?.roleTitle}
                  </span>
                </div>
              </label>
            </div>

            {/* Optional Owner CC & Custom Emails */}
            <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeOwner}
                  onChange={(e) => setIncludeOwner(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>CC Owner David Sterling ({ownerUser.email})</span>
              </label>

              <form onSubmit={handleAddCustomEmail} className="flex items-center space-x-1.5">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="Add another email..."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </form>
            </div>

            {customEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center space-x-1 bg-slate-900 text-indigo-300 px-2 py-0.5 rounded-lg text-xs border border-slate-800 font-mono"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => setCustomEmails(customEmails.filter((e) => e !== email))}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. Email Preview & Composer */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Body Message
              </label>
              <textarea
                rows={7}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 4. Past Dispatch Audit Logs if any */}
          {task.meetingDetails?.emailDispatchLogs && task.meetingDetails.emailDispatchLogs.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Meeting Link Dispatch History ({task.meetingDetails.emailDispatchLogs.length})
              </span>
              <div className="space-y-1.5">
                {task.meetingDetails.emailDispatchLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Sent by <strong>{log.sentBy}</strong> to{' '}
                        <span className="text-indigo-300 font-mono">{log.recipients.join(', ')}</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Selected: <strong className="text-white">{selectedRecipients.length} doer email(s)</strong>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {/* Direct Mail App Button */}
            <button
              type="button"
              onClick={handleOpenEmailApp}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 flex items-center justify-center space-x-1.5 transition-all shadow"
              title="Launch Gmail / Outlook with pre-filled emails and meeting link"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Mail App</span>
            </button>

            {/* Direct System Dispatch Button */}
            <button
              type="button"
              onClick={handleSystemDispatch}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>Send Link & Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Plus,
  Repeat,
  Send,
  Calendar,
  Clock,
  Trash2,
  CheckSquare,
  Users,
  Shield,
  UserCheck,
  Tag,
  Video,
  Mail,
  Sparkles,
  Link,
  ExternalLink,
  Check,
  Mic,
  MicOff,
} from 'lucide-react';
import {
  TaskType,
  TaskPriority,
  RecurrenceFrequency,
  ChecklistItem,
  MeetingType,
  MeetingDetails,
} from '../types';
import { useTasks } from '../context/TaskContext';

interface CreateTaskModalProps {
  onClose: () => void;
}

export interface MeetingTypeOption {
  type: MeetingType;
  label: string;
  badge: string;
  icon: string;
  defaultTitle: string;
  defaultCategory: string;
  description: string;
}

type VoiceField = 'title' | 'description';

interface VoiceRecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}

interface VoiceRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<VoiceRecognitionResult>;
}

interface VoiceRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface VoiceRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: VoiceRecognitionEvent) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type VoiceRecognitionConstructor = new () => VoiceRecognition;

interface SpeechWindow extends Window {
  SpeechRecognition?: VoiceRecognitionConstructor;
  webkitSpeechRecognition?: VoiceRecognitionConstructor;
}

export const MEETING_TYPE_OPTIONS: MeetingTypeOption[] = [
  {
    type: 'PURCHASE_MEETING',
    label: 'Purchase Meeting',
    badge: 'PURCHASE',
    icon: '💼',
    defaultTitle: 'Purchase Meeting: Vendor Price Negotiation & PO Authorization',
    defaultCategory: 'Finance & Compliance',
    description: 'Review procurement invoices, supplier quotes, material orders, and budget allocations.',
  },
  {
    type: 'IMS_MEETING',
    label: 'IMS Meeting',
    badge: 'IMS',
    icon: '📦',
    defaultTitle: 'IMS Meeting: Inventory Management System & Stock Variance Review',
    defaultCategory: 'Operations & Systems',
    description: 'Audit warehouse inventory, stock balance levels, order fulfillment cycle times, and ERP sync.',
  },
  {
    type: 'SALE_MEETING',
    label: 'Sale Meeting',
    badge: 'SALES',
    icon: '📈',
    defaultTitle: 'Sale Meeting: Client Pipeline Review & Revenue Target Alignment',
    defaultCategory: 'Growth & Marketing',
    description: 'Review enterprise sales pipeline, lead conversion metrics, client contracts, and monthly revenue.',
  },
  {
    type: 'EXECUTIVE_REVIEW',
    label: 'Executive Review Meeting',
    badge: 'EXECUTIVE',
    icon: '👑',
    defaultTitle: 'Executive Leadership: Operational Strategy & Deliverable Sign-Off',
    defaultCategory: 'Executive Leadership',
    description: 'High-level executive alignment, strategic roadmap review, and organizational milestones.',
  },
  {
    type: 'VENDOR_PROCUREMENT',
    label: 'Vendor & Procurement Meeting',
    badge: 'VENDOR',
    icon: '🤝',
    defaultTitle: 'Vendor Contract Evaluation & SLA Performance Audit',
    defaultCategory: 'Finance & Compliance',
    description: 'Evaluate external contractor deliverables, renegotiate terms, and finalize supplier SLAs.',
  },
  {
    type: 'OPERATIONS_LOGISTICS',
    label: 'Operations & Logistics Meeting',
    badge: 'OPERATIONS',
    icon: '🚚',
    defaultTitle: 'Operations & Logistics: Distribution Fleet & Dispatch Sync',
    defaultCategory: 'Operations & Systems',
    description: 'Coordinate fulfillment routes, fleet logistics handoffs, and operational bottlenecks.',
  },
  {
    type: 'QUARTERLY_STRATEGY',
    label: 'Quarterly Strategy Meeting',
    badge: 'STRATEGY',
    icon: '🎯',
    defaultTitle: 'Q4 Strategic Planning & Cross-Departmental Resource Allocation',
    defaultCategory: 'Executive Leadership',
    description: 'Define upcoming quarterly goals, OKRs, team budgets, and headcount expansion.',
  },
  {
    type: 'GENERAL_TEAM_SYNC',
    label: 'General Team Sync / Standup',
    badge: 'SYNC',
    icon: '👥',
    defaultTitle: 'Weekly Operations Sync: Action Items & Blockers Review',
    defaultCategory: 'Operations & Systems',
    description: 'General team standup to unblock items, sync deliverables, and track work progress.',
  },
  {
    type: 'CUSTOM',
    label: 'Custom Meeting Agenda...',
    badge: 'CUSTOM',
    icon: '✨',
    defaultTitle: 'Strategic Coordination Meeting',
    defaultCategory: 'Operations & Systems',
    description: 'Custom meeting purpose, agenda, and participant list.',
  },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose }) => {
  const { teamMembers, createTask, ownerUser } = useTasks();
  const [activeVoiceField, setActiveVoiceField] = useState<VoiceField | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  const [type, setType] = useState<TaskType>('DELEGATION');
  const [isMeeting, setIsMeeting] = useState(true);
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType>('PURCHASE_MEETING');
  const [customMeetingLabel, setCustomMeetingLabel] = useState('');

  const [title, setTitle] = useState('Purchase Meeting: Vendor Price Negotiation & PO Authorization');
  const [description, setDescription] = useState(
    'Review procurement invoices, supplier quotes, material orders, and budget allocations.'
  );
  const [category, setCategory] = useState('Finance & Compliance');
  const [priority, setPriority] = useState<TaskPriority>('HIGH');

  // Meeting Specifics
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [meetingTime, setMeetingTime] = useState('11:00');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/new');
  const [agendaNotes, setAgendaNotes] = useState('');

  // Default due date: 2 days out
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });

  // 3-Tier Delegation Chain
  const [primaryDoerId, setPrimaryDoerId] = useState<string>(teamMembers[0]?.id || '');
  const [secondaryDoerId, setSecondaryDoerId] = useState<string>(teamMembers[1]?.id || '');
  const [subSecondaryDoerId, setSubSecondaryDoerId] = useState<string>(teamMembers[2]?.id || '');

  // Secondary & Sub-Secondary Email state (Owner can edit/provide custom emails)
  const [secondaryDoerEmail, setSecondaryDoerEmail] = useState<string>(
    teamMembers[1]?.email || 'sarah.lin@enterprise.co'
  );
  const [subSecondaryDoerEmail, setSubSecondaryDoerEmail] = useState<string>(
    teamMembers[2]?.email || 'marcus.v@enterprise.co'
  );
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newExtraEmail, setNewExtraEmail] = useState('');

  // Recurrence Config (for RECURRING type)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('WEEKLY');
  const [timeOfDay, setTimeOfDay] = useState('09:00');

  // Checklist items
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'chk-meet-1',
      title: `Primary Doer (${teamMembers[0]?.name || 'Primary'}) dispatches video link via email to Secondary (${teamMembers[1]?.email || 'Secondary'}) and Sub-Sec (${teamMembers[2]?.email || 'Sub-Sec'})`,
      completed: false,
    },
    { id: 'chk-meet-2', title: 'Confirm agenda briefing notes and all attendees present in room', completed: false },
    { id: 'chk-meet-3', title: 'Conduct session, document key decisions and actionable takeaways', completed: false },
    { id: 'chk-meet-4', title: 'Upload meeting minutes / proof screenshot for Owner verification stamp', completed: false },
  ]);
  const [newChecklistInput, setNewChecklistInput] = useState('');

  useEffect(() => () => {
    recognitionRef.current?.stop();
  }, []);

  const toggleVoiceInput = (field: VoiceField) => {
    if (activeVoiceField === field) {
      recognitionRef.current?.stop();
      return;
    }

    const previousRecognition = recognitionRef.current;
    recognitionRef.current = null;
    previousRecognition?.stop();
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError('Voice input is not supported in this browser. Try the latest Chrome or Edge.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    let hasTranscript = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0].transcript.trim())
        .filter(Boolean)
        .join(' ');

      if (!transcript) return;
      const replaceCurrentText = !hasTranscript;
      hasTranscript = true;
      if (field === 'title') {
        setTitle((current) => replaceCurrentText || !current ? transcript : `${current} ${transcript}`);
      } else {
        setDescription((current) => replaceCurrentText || !current ? transcript : `${current} ${transcript}`);
      }
    };
    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access is blocked. Allow microphone access in your browser settings and try again.',
        'service-not-allowed': 'The browser speech recognition service is unavailable.',
        'no-speech': 'No speech was detected. Try speaking closer to your microphone.',
        'audio-capture': 'No microphone was found. Connect or enable a microphone and try again.',
        network: 'Voice recognition needs an internet connection. Check your connection and try again.',
      };
      setVoiceError(messages[event.error] || `Voice input failed (${event.error}). Please try again.`);
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setActiveVoiceField(null);
    };

    setVoiceError(null);
    setActiveVoiceField(field);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      setActiveVoiceField(null);
      setVoiceError(error instanceof Error ? error.message : 'Could not start voice input.');
    }
  };

  const CATEGORIES = [
    'Operations & Systems',
    'Finance & Compliance',
    'Engineering & DevOps',
    'Growth & Marketing',
    'Executive Leadership',
    'Legal & Governance',
  ];

  // Helper when selecting a meeting type from the dropdown
  const handleSelectMeetingType = (mType: MeetingType) => {
    setSelectedMeetingType(mType);
    setIsMeeting(true);

    const found = MEETING_TYPE_OPTIONS.find((opt) => opt.type === mType);
    if (found) {
      setTitle(found.defaultTitle);
      setCategory(found.defaultCategory);
      setDescription(found.description);
    }

    // Set meeting checklist items
    const primaryMember = teamMembers.find((m) => m.id === primaryDoerId);
    setChecklist([
      {
        id: 'chk-meet-1',
        title: `Primary Doer (${primaryMember?.name || 'Primary'}) dispatches video link via email to Secondary (${secondaryDoerEmail}) and Sub-Sec (${subSecondaryDoerEmail})`,
        completed: false,
      },
      {
        id: 'chk-meet-2',
        title: 'Confirm agenda briefing notes and all attendees present in room',
        completed: false,
      },
      {
        id: 'chk-meet-3',
        title: 'Conduct session, document key decisions and actionable takeaways',
        completed: false,
      },
      {
        id: 'chk-meet-4',
        title: 'Upload meeting minutes / proof screenshot for Owner verification stamp',
        completed: false,
      },
    ]);
  };

  const handleSecondaryDoerChange = (newId: string) => {
    setSecondaryDoerId(newId);
    const member = teamMembers.find((m) => m.id === newId);
    setSecondaryDoerEmail(member?.email || '');
  };

  const handleSubSecondaryDoerChange = (newId: string) => {
    setSubSecondaryDoerId(newId);
    const member = teamMembers.find((m) => m.id === newId);
    setSubSecondaryDoerEmail(member?.email || '');
  };

  const handleAddExtraEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExtraEmail.trim() && newExtraEmail.includes('@')) {
      if (!additionalEmails.includes(newExtraEmail.trim())) {
        setAdditionalEmails([...additionalEmails, newExtraEmail.trim()]);
      }
      setNewExtraEmail('');
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistInput.trim()) {
      setChecklist([
        ...checklist,
        {
          id: `chk-${Date.now()}`,
          title: newChecklistInput.trim(),
          completed: false,
        },
      ]);
      setNewChecklistInput('');
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((c) => c.id !== id));
  };

  const handleGenerateMeet = () => {
    const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    setMeetingLink(`https://meet.google.com/${code}`);
  };

  const primaryDoer = teamMembers.find((m) => m.id === primaryDoerId);
  const secondaryDoer = teamMembers.find((m) => m.id === secondaryDoerId);
  const subSecondaryDoer = teamMembers.find((m) => m.id === subSecondaryDoerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const currentOption = MEETING_TYPE_OPTIONS.find((o) => o.type === selectedMeetingType);
    const finalMeetingLabel =
      selectedMeetingType === 'CUSTOM' && customMeetingLabel.trim()
        ? customMeetingLabel.trim()
        : currentOption?.label || 'Corporate Meeting';

    const finalRecipientEmails = [
      secondaryDoerEmail.trim(),
      subSecondaryDoerEmail.trim(),
      ...additionalEmails,
    ].filter(Boolean);

    const meetingDetails: MeetingDetails | undefined = isMeeting
      ? {
          isMeeting: true,
          meetingType: selectedMeetingType,
          meetingTypeLabel: finalMeetingLabel,
          meetingLink: meetingLink.trim(),
          scheduledDate: meetingDate,
          scheduledTime: meetingTime,
          agendaNotes: agendaNotes.trim() || description.trim(),
          linkDispatched: false,
          recipientEmails: finalRecipientEmails,
          emailSubject: `[${finalMeetingLabel}] Video Link & Agenda: ${title.trim()}`,
        }
      : undefined;

    createTask({
      title: title.trim(),
      description: description.trim(),
      type,
      status: 'IN_PROGRESS',
      priority,
      category,
      dueDate: new Date(dueDate).toISOString(),
      primaryDoerId,
      secondaryDoerId,
      subSecondaryDoerId,
      meetingDetails,
      checklist,
      recurrence:
        type === 'RECURRING'
          ? {
              frequency,
              timeOfDay,
              streakCount: 0,
              nextDueDate: new Date(dueDate).toISOString(),
            }
          : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                  EXECUTIVE TASK DELEGATION DOCK
                </span>
                {isMeeting && (
                  <span className="text-[9px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                    MEETING WORKFLOW ACTIVE
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">
                Create & Delegate Work
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {/* 1. Task Architecture: Standard vs Meeting vs Recurring */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Task Architecture
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Standard Delegation */}
              <button
                type="button"
                onClick={() => {
                  setType('DELEGATION');
                  setIsMeeting(false);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  type === 'DELEGATION' && !isMeeting
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      type === 'DELEGATION' && !isMeeting ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-white">Delegation Task</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  One-time strategic assignment with proof verification
                </span>
              </button>

              {/* Option 2: Meeting Delegation (User's Core Feature) */}
              <button
                type="button"
                onClick={() => {
                  setType('DELEGATION');
                  setIsMeeting(true);
                  handleSelectMeetingType(selectedMeetingType);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between relative overflow-hidden ${
                  type === 'DELEGATION' && isMeeting
                    ? 'bg-linear-to-br from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-400 text-white shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg font-mono">
                  MEETING
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      type === 'DELEGATION' && isMeeting ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-white">Meeting Delegation</span>
                </div>
                <span className="text-[10px] text-slate-300 leading-tight">
                  Purchase, IMS, Sale & Team meetings with email link dispatch
                </span>
              </button>

              {/* Option 3: Recurring SOP Task */}
              <button
                type="button"
                onClick={() => {
                  setType('RECURRING');
                  setIsMeeting(false);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  type === 'RECURRING'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-md shadow-cyan-600/20 ring-1 ring-cyan-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      type === 'RECURRING' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-white">Recurring SOP</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Cadenced routine (Daily, Weekly, Monthly) with streak tracking
                </span>
              </button>
            </div>
          </div>

          {/* 2. MEETING TYPE DROPDOWN & MEETING SETTINGS (The User's Feature!) */}
          {isMeeting && (
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Meeting Type & Video Conference Configuration
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Select meeting type. Primary Doer will send the meeting link to Secondary & Sub-Sec doers on mail.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  {selectedMeetingType}
                </span>
              </div>

              {/* MEETING TYPE SELECTOR DROPDOWN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-200 mb-1.5">
                    Meeting Type Dropdown <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedMeetingType}
                    onChange={(e) => handleSelectMeetingType(e.target.value as MeetingType)}
                    className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                  >
                    {MEETING_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMeetingType === 'CUSTOM' ? (
                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1.5">
                      Custom Meeting Title / Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Audit Committee Sync"
                      value={customMeetingLabel}
                      onChange={(e) => setCustomMeetingLabel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-indigo-200 mb-1.5">
                      Meeting Focus Description
                    </label>
                    <div className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-indigo-500/20">
                      {MEETING_TYPE_OPTIONS.find((o) => o.type === selectedMeetingType)?.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduled Date, Time & Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => {
                      setMeetingDate(e.target.value);
                      setDueDate(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meeting Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Video Meeting Link
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateMeet}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      + Google Meet
                    </button>
                  </div>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Meeting Agenda Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meeting Agenda / Key Discussion Points
                </label>
                <textarea
                  rows={2}
                  value={agendaNotes}
                  onChange={(e) => setAgendaNotes(e.target.value)}
                  placeholder="Outline key discussion items (e.g., budget limits, stock variances, deal contract terms)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Recipient Notice Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-start space-x-3 text-xs">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">
                    Automatic Email Dispatch Workflow
                  </span>
                  <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                    When you click <strong>Delegate Task</strong>, the <strong>Primary Doer ({primaryDoer?.name || 'Primary'})</strong> is assigned to host the meeting. Their portal will display a prominent <strong>"Send Meeting Link on Mail"</strong> action with the pre-filled corporate emails for <strong>Secondary Doer ({secondaryDoer?.name} - {secondaryDoer?.email})</strong> and <strong>Sub-Secondary Doer ({subSecondaryDoer?.name} - {subSecondaryDoer?.email})</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recurrence Cadence Settings if Recurring */}
          {type === 'RECURRING' && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-cyan-200 mb-1.5">
                  Recurrence Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="DAILY">Daily (Every 24 hours)</option>
                  <option value="WEEKLY">Weekly (Every 7 days)</option>
                  <option value="BIWEEKLY">Bi-Weekly (Every 14 days)</option>
                  <option value="MONTHLY">Monthly (End of month audit)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-cyan-200 mb-1.5">
                  Execution Cut-off Time
                </label>
                <input
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* 3. Core Task Information */}
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Task / Meeting Title <span className="text-indigo-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('title')}
                  aria-pressed={activeVoiceField === 'title'}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    activeVoiceField === 'title'
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      : 'border-slate-700 bg-slate-900 text-indigo-300 hover:border-indigo-500'
                  }`}
                >
                  {activeVoiceField === 'title' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {activeVoiceField === 'title' ? 'Stop voice input' : 'Speak title'}
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Purchase Meeting: Q4 Vendor PO Approvals"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Instructions & Deliverable Requirements
                </label>
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('description')}
                  aria-pressed={activeVoiceField === 'description'}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    activeVoiceField === 'description'
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      : 'border-slate-700 bg-slate-900 text-indigo-300 hover:border-indigo-500'
                  }`}
                >
                  {activeVoiceField === 'description' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {activeVoiceField === 'description' ? 'Stop voice input' : 'Speak instructions'}
                </button>
              </div>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Define explicit success criteria, requirements, and what proof will be inspected upon completion..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            {activeVoiceField && (
              <p role="status" className="text-xs text-indigo-300">
                Listening for {activeVoiceField === 'title' ? 'the task title' : 'task instructions'}… Speak clearly, then select Stop voice input.
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Voice input needs a supported browser, microphone permission, and an internet connection.
            </p>
            {voiceError && (
              <p role="alert" className="text-xs text-rose-300">{voiceError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="URGENT">🔴 Urgent (High Impact)</option>
                  <option value="HIGH">🟠 High Priority</option>
                  <option value="MEDIUM">🔵 Medium</option>
                  <option value="LOW">⚪ Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 4. 3-TIER DELEGATION CHAIN (Showing Names & Real Corporate Emails) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Delegation Hierarchy & Attendee Emails
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Primary Doer hosts and sends the meeting link. Provide/edit Secondary & Sub-Sec doer emails below.
                </p>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-semibold self-start sm:self-auto">
                3-Tier Accountability Chain
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Primary Doer */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-indigo-500/40 flex flex-col justify-between">
                <div>
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Primary Doer {isMeeting && '(Host)'}</span>
                  </label>
                  <select
                    value={primaryDoerId}
                    onChange={(e) => setPrimaryDoerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Host Corporate Email:</span>
                  <span className="text-xs text-indigo-300 font-mono font-bold block truncate mt-0.5">
                    ✉️ {primaryDoer?.email || 'N/A'}
                  </span>
                  <span className="text-[10px] text-indigo-400/90 block mt-1 font-semibold">
                    {isMeeting ? '⚡ Dispatches video link on mail' : 'Primary SLA holder'}
                  </span>
                </div>
              </div>

              {/* Secondary Doer */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Secondary Doer</span>
                  </label>
                  <select
                    value={secondaryDoerId}
                    onChange={(e) => handleSecondaryDoerChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editable Secondary Email input (User requirement) */}
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Secondary Doer Email <span className="text-emerald-400 font-normal">(Receives Link)</span>
                  </label>
                  <input
                    type="email"
                    value={secondaryDoerEmail}
                    onChange={(e) => setSecondaryDoerEmail(e.target.value)}
                    placeholder="secondary@enterprise.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {isMeeting ? 'Primary will send link to this mail' : 'Secondary backup & peer audit'}
                  </span>
                </div>
              </div>

              {/* Sub-Secondary Doer */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Sub-Secondary Doer</span>
                  </label>
                  <select
                    value={subSecondaryDoerId}
                    onChange={(e) => handleSubSecondaryDoerChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editable Sub-Secondary Email input (User requirement) */}
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Sub-Sec Doer Email <span className="text-emerald-400 font-normal">(Receives Link)</span>
                  </label>
                  <input
                    type="email"
                    value={subSecondaryDoerEmail}
                    onChange={(e) => setSubSecondaryDoerEmail(e.target.value)}
                    placeholder="subsec@enterprise.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {isMeeting ? 'Primary will send link to this mail' : '3rd tier escalation fallback'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Attendee Emails (Optional) */}
            <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 text-[11px]">
                Additional CC Attendee Emails:
              </span>

              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={newExtraEmail}
                  onChange={(e) => setNewExtraEmail(e.target.value)}
                  placeholder="extra.attendee@enterprise.co"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                />
                <button
                  type="button"
                  onClick={handleAddExtraEmail}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold"
                >
                  + Add CC
                </button>
              </div>
            </div>

            {additionalEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {additionalEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center space-x-1 bg-slate-900 text-indigo-300 px-2 py-0.5 rounded-lg text-xs border border-slate-800 font-mono"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => setAdditionalEmails(additionalEmails.filter((e) => e !== email))}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Delegation Dispatch Workflow Guarantee */}
            {isMeeting && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start space-x-3 text-xs">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">
                    Delegation Workflow Guarantee:
                  </span>
                  <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                    When Owner ({ownerUser.name}) delegates this <strong>{selectedMeetingType.replace('_', ' ')}</strong>, the task is handed off to <strong>{primaryDoer?.name} (Primary Host)</strong>. {primaryDoer?.name} will see a prominent action dock to dispatch the video meeting link to <strong>Secondary ({secondaryDoerEmail})</strong> and <strong>Sub-Secondary ({subSecondaryDoerEmail})</strong> on mail.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 5. Checklist Builder */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Verification Criteria Checklist
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {checklist.length} items defined
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 flex items-center space-x-2">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{item.title}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2 pt-1">
              <input
                type="text"
                value={newChecklistInput}
                onChange={(e) => setNewChecklistInput(e.target.value)}
                placeholder="Add another verification milestone..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Task will be logged with full immutable audit history.
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] flex items-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isMeeting ? `Delegate ${selectedMeetingType.replace('_', ' ')}` : 'Delegate Task'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

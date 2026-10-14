import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  Link as LinkIcon,
  Palette,
  Camera,
  Trash2,
  RefreshCw,
  User,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { TeamMember } from '../types';
import { useTasks } from '../context/TaskContext';

interface EditAvatarModalProps {
  user: TeamMember;
  onClose: () => void;
}

export interface PresetAvatar {
  id: string;
  label: string;
  category: 'leadership' | 'operations' | 'tech' | 'illustrated';
  url: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Leadership & Executive Portraits
  {
    id: 'av-exec-1',
    label: 'Executive Male (Suit)',
    category: 'leadership',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-exec-2',
    label: 'Managing Director Male',
    category: 'leadership',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-exec-3',
    label: 'Executive Female Lead',
    category: 'leadership',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-exec-4',
    label: 'Senior Vice President',
    category: 'leadership',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-exec-5',
    label: 'Corporate Strategy Director',
    category: 'leadership',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-exec-6',
    label: 'Executive Operations Head',
    category: 'leadership',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  },

  // Operations & Project Management
  {
    id: 'av-ops-1',
    label: 'Operations Coordinator',
    category: 'operations',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-ops-2',
    label: 'Senior Operations Lead',
    category: 'operations',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-ops-3',
    label: 'Project Manager Female',
    category: 'operations',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-ops-4',
    label: 'Quality Assurance Manager',
    category: 'operations',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-ops-5',
    label: 'Logistics Lead',
    category: 'operations',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-ops-6',
    label: 'Business Analyst',
    category: 'operations',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
  },

  // Tech, Engineering & Design
  {
    id: 'av-tech-1',
    label: 'Tech Lead / Architect',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-tech-2',
    label: 'Senior Software Engineer',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-tech-3',
    label: 'Creative UI/UX Designer',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-tech-4',
    label: 'Product Designer',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-tech-5',
    label: 'DevOps & Cloud Engineer',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-tech-6',
    label: 'Database Administrator',
    category: 'tech',
    url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  },

  // Modern Illustrated & 3D Avatar Icons
  {
    id: 'av-illus-1',
    label: '3D Modern Specialist',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-illus-2',
    label: '3D Vibrant Creator',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-illus-3',
    label: '3D Minimalist Avatar',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-illus-4',
    label: '3D Modern Professional',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-illus-5',
    label: '3D Friendly Specialist',
    category: 'illustrated',
    url: 'https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=200&auto=format&fit=crop&q=80',
  },
];

export const AVATAR_COLORS = [
  { name: 'Executive Indigo', color: '#4f46e5', gradient: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' },
  { name: 'Sapphire Blue', color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
  { name: 'Emerald Green', color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
  { name: 'Teal Cyan', color: '#0d9488', gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' },
  { name: 'Purple Dawn', color: '#9333ea', gradient: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' },
  { name: 'Rose Red', color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' },
  { name: 'Amber Gold', color: '#d97706', gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' },
  { name: 'Electric Pink', color: '#db2777', gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)' },
  { name: 'Ocean Sky', color: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' },
  { name: 'Dark Slate', color: '#334155', gradient: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' },
];

export const generateInitialsAvatar = (
  name: string,
  bgColor: string = '#4f46e5',
  customInitials?: string
): string => {
  const letters = (
    customInitials ||
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
  ).toUpperCase() || 'U';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.65" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="30" fill="url(#grad)" />
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="38" fill="#ffffff" letter-spacing="1">${letters}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const EditAvatarModal: React.FC<EditAvatarModalProps> = ({ user, onClose }) => {
  const { updateUserCredentials } = useTasks();

  const [avatarUrl, setAvatarUrl] = useState(user.avatar);
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PRESETS' | 'INITIALS' | 'URL'>('UPLOAD');
  const [presetCategory, setPresetCategory] = useState<'all' | 'leadership' | 'operations' | 'tech' | 'illustrated'>('all');
  const [urlInput, setUrlInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(user.accentColor || '#4f46e5');
  const [customInitials, setCustomInitials] = useState(
    user.name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  );
  const [isSaved, setIsSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // File Upload Handler (Converts image to base64 Data URL)
  const processFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setAvatarUrl(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleSelectColorForInitials = (color: string, initials?: string) => {
    setSelectedColor(color);
    const generated = generateInitialsAvatar(user.name, color, initials || customInitials);
    setAvatarUrl(generated);
  };

  const handleSave = () => {
    updateUserCredentials(user.id, {
      avatar: avatarUrl,
      accentColor: selectedColor,
    });
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const filteredPresets = PRESET_AVATARS.filter(
    (p) => presetCategory === 'all' || p.category === presetCategory
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 font-mono">
                  AVATAR & PHOTO CUSTOMIZER
                </span>
                {user.isOwner ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">
                    OWNER / ADMIN
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold font-mono">
                    EMPLOYEE
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white">
                Set Custom Avatar for {user.name}
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

        {/* Live Multi-Size Preview Bar */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Primary Large Preview */}
            <div className="relative">
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/40 shadow-xl bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(user.name);
                }}
              />
              <span
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-950 flex items-center justify-center text-white text-[11px] shadow z-10"
                style={{ backgroundColor: selectedColor }}
              >
                ✓
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-white block">{user.name}</span>
              <span className="text-[11px] text-slate-400 block font-mono">{user.email}</span>
              <span className="text-[10px] text-indigo-400 block mt-0.5 font-semibold">
                {user.roleTitle} • {user.department}
              </span>
            </div>
          </div>

          {/* Contextual Previews: Medium (Cards) & Small (Navbar) */}
          <div className="flex items-center space-x-3 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-center">
              <img
                src={avatarUrl}
                alt="Medium Card Preview"
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(user.name);
                }}
              />
              <span className="text-[9px] text-slate-500 block mt-1 font-mono">Task Card</span>
            </div>

            <div className="w-px h-8 bg-slate-800" />

            <div className="text-center">
              <img
                src={avatarUrl}
                alt="Navbar Badge Preview"
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-700 mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(user.name);
                }}
              />
              <span className="text-[9px] text-slate-500 block mt-1 font-mono">Navbar</span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="p-6 space-y-5">
          <div className="flex border-b border-slate-800 pb-2 gap-1 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'UPLOAD'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>

            <button
              onClick={() => setActiveTab('PRESETS')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'PRESETS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Portraits & 3D</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('INITIALS');
                handleSelectColorForInitials(selectedColor);
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'INITIALS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Monogram</span>
            </button>

            <button
              onClick={() => setActiveTab('URL')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'URL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Image URL</span>
            </button>
          </div>

          {/* TAB 1: UPLOAD LOCAL FILE FROM COMPUTER OR PHONE */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-white block">
                  Click to Upload or Drag & Drop Image
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Upload any photo from your computer, phone, or tablet (PNG, JPG, WebP, GIF, SVG)
                </span>
                <span className="text-[10px] text-indigo-400 font-mono mt-2 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  Max file size: 8MB • Saved directly to database
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Supports personal camera selfies, LinkedIn headshots, and corporate badges.</span>
                <button
                  type="button"
                  onClick={() => setAvatarUrl(user.avatar)}
                  className="text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to current</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXPANDED PORTRAIT & 3D PRESET LIBRARY */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { id: 'all', label: 'All Photos' },
                    { id: 'leadership', label: 'Leadership' },
                    { id: 'operations', label: 'Operations' },
                    { id: 'tech', label: 'Tech & Design' },
                    { id: 'illustrated', label: '3D / Illustrated' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPresetCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      presetCategory === cat.id
                        ? 'bg-slate-200 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid of Presets */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 pr-2">
                {filteredPresets.map((preset) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      title={preset.label}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all p-0.5 group aspect-square ${
                        isSelected
                          ? 'border-indigo-500 ring-4 ring-indigo-500/40 scale-105 z-10'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[1px] flex items-center justify-center">
                          <Check className="w-5 h-5 text-white font-black stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-400 block text-center">
                Click any portrait or 3D icon to select instantly.
              </span>
            </div>
          )}

          {/* TAB 3: CUSTOM MONOGRAM & INITIALS */}
          {activeTab === 'INITIALS' && (
            <div className="space-y-4">
              {/* Custom Initials Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Initials Text (1-3 Letters)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    maxLength={3}
                    value={customInitials}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCustomInitials(val);
                      handleSelectColorForInitials(selectedColor, val);
                    }}
                    placeholder="e.g. DS"
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-center focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  <span className="text-xs text-slate-400 flex items-center">
                    Customize letter abbreviation displayed on the avatar
                  </span>
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Select Corporate Theme Color:
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {AVATAR_COLORS.map((item) => {
                    const isSelected = selectedColor === item.color;
                    return (
                      <button
                        key={item.color}
                        type="button"
                        onClick={() => handleSelectColorForInitials(item.color)}
                        title={item.name}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: item.color }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECT IMAGE URL */}
          {activeTab === 'URL' && (
            <div className="space-y-3 text-xs">
              <label className="block text-slate-300 font-bold mb-1">
                Paste Image Web Link (HTTPS from Unsplash, Google Drive, Company Intranet, GitHub)
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
                >
                  Preview & Apply
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                You can copy any image address from the web and paste it here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaved ? 'Saving Avatar...' : 'Save & Update Avatar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

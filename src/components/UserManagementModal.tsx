import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Check,
  Plus,
  Shield,
  User,
  Edit2,
  Trash2,
  Save,
  Camera,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TeamMember } from '../types';
import { EditAvatarModal, PRESET_AVATARS, generateInitialsAvatar } from './EditAvatarModal';

interface UserManagementModalProps {
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const {
    ownerUser,
    teamMembers,
    updateUserCredentials,
    addNewTeamMember,
    deleteTeamMember,
  } = useTasks();

  // Dedicated Avatar Modal state
  const [selectedUserForAvatar, setSelectedUserForAvatar] = useState<TeamMember | null>(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Add new employee state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operations');
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0].url);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleStartEdit = (user: TeamMember) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.roleTitle);
    setEditDepartment(user.department);
    setEditAvatar(user.avatar);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUserCredentials(editingUser.id, {
      name: editName.trim(),
      roleTitle: editRole.trim(),
      department: editDepartment.trim(),
      avatar: editAvatar.trim() || editingUser.avatar,
    });

    setNotificationMsg(`Profile for ${editName} updated successfully.`);
    setEditingUser(null);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Handle local file upload in edit modal
  const handleEditAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local file upload in add new employee modal
  const handleNewAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Name and email are required.');
      return;
    }

    try {
      await addNewTeamMember({
        name: newName.trim(),
        email: newEmail.trim(),
        roleTitle: newRole.trim() || 'Team Specialist',
        department: newDepartment.trim() || 'Operations',
        avatar: newAvatar || PRESET_AVATARS[0].url,
        accentColor: '#3b82f6',
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Employee invitation failed.');
      return;
    }

    setNotificationMsg(`New employee ${newName} added successfully!`);
    setIsAddingNew(false);
    setNewName('');
    setNewEmail('');
    setNewRole('');
    setNewAvatar(PRESET_AVATARS[0].url);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const allAccounts = [ownerUser, ...teamMembers];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  EMPLOYEE PROFILE MANAGEMENT
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  ADMIN AUTHORITY
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Employee Accounts & Profiles
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

        {/* Success toast */}
        {notificationMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          {/* Admin Authority Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-slate-300 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">
                  Employee Profile Administration
                </h4>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Invite employees by email. Supabase sends them a secure sign-up link; passwords are never stored or visible in DelegateOS.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddingNew(true)}
              className="shrink-0 flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>

          {/* Accounts List Table */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Team Accounts ({allAccounts.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Account credentials are securely managed by Supabase Auth.
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {allAccounts.map((member) => {
                const isOwner = member.isOwner || member.id === ownerUser.id;

                return (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                  >
                    {/* User Profile + Avatar Clickable */}
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Avatar with Camera Icon Overlay on Hover */}
                      <div
                        onClick={() => setSelectedUserForAvatar(member)}
                        className="relative shrink-0 group cursor-pointer"
                        title="Click to edit / change profile photo"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800 group-hover:ring-indigo-500 transition-all bg-slate-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = generateInitialsAvatar(member.name);
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                          <Camera className="w-4 h-4 text-indigo-300 mb-0.5" />
                          <span>Edit</span>
                        </div>
                        {isOwner && (
                          <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full ring-2 ring-slate-950 z-10">
                            <Shield className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white truncate">
                            {member.name}
                          </span>
                          {isOwner ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                              OWNER / ADMIN
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                              {member.department}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-indigo-300 font-mono block truncate">
                          {member.email}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {member.roleTitle}
                        </span>
                      </div>
                    </div>

                    {/* Profile Controls */}
                    <div className="flex items-center space-x-2.5">
                      {/* Change Avatar Button */}
                      <button
                        onClick={() => setSelectedUserForAvatar(member)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
                        title="Change Profile Photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="hidden sm:inline">Photo</span>
                      </button>

                      <span className="text-[10px] text-slate-500">Supabase Auth</span>

                      {/* Reset / Edit Button */}
                      <button
                        onClick={() => handleStartEdit(member)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete button (Only for added employees, not Owner) */}
                      {!isOwner && (
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to remove ${member.name}?`)) {
                              try {
                                await deleteTeamMember(member.id);
                                setNotificationMsg(`${member.name}'s account was removed.`);
                              } catch (error) {
                                alert(error instanceof Error ? error.message : 'Could not remove employee account.');
                              }
                            }
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {allAccounts.length} Total Registered Users in Database
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Vault
          </button>
        </div>
      </div>

      {/* DEDICATED AVATAR MODAL */}
      {selectedUserForAvatar && (
        <EditAvatarModal
          user={selectedUserForAvatar}
          onClose={() => setSelectedUserForAvatar(null)}
        />
      )}

      {/* EDIT / RESET CREDENTIALS & AVATAR SUB-MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Edit Profile: {editingUser.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Avatar Selector in Edit */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={editAvatar}
                    alt={editName}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-500/50 bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = generateInitialsAvatar(editName);
                    }}
                  />
                  <div>
                    <span className="font-bold text-white block">Profile Avatar Photo</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Upload custom photo or pick from presets
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditAvatar(generateInitialsAvatar(editName))}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Generate Initials Monogram"
                  >
                    Initials
                  </button>
                </div>
              </div>

              {/* Preset quick avatars */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Or pick a preset avatar:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEditAvatar(preset.url)}
                      className={`relative shrink-0 w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                        editAvatar === preset.url ? 'border-indigo-500 ring-2 ring-indigo-500/40' : 'border-slate-800'
                      }`}
                    >
                      <img src={preset.url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Login Email</label>
                <p className="text-indigo-300 font-mono">{editingUser.email}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Login email and password are handled by Supabase Auth.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role Title</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW EMPLOYEE SUB-MODAL */}
      {isAddingNew && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Add New Office Employee</h3>
              </div>
              <button
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewSubmit} className="space-y-4 text-xs">
              {/* Avatar Selector for New Employee */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={newAvatar}
                    alt="New avatar"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/50 bg-slate-800"
                  />
                  <div>
                    <span className="font-bold text-white block">Employee Avatar Photo</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Upload photo or choose preset
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewAvatar(generateInitialsAvatar(newName || 'New User'))}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    Initials
                  </button>
                </div>
              </div>

              {/* Preset quick selection */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Or select preset portrait ({PRESET_AVATARS.length} available):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNewAvatar(preset.url)}
                      title={preset.label}
                      className={`relative shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                        newAvatar === preset.url ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Corporate Email (Login Username)
                </label>
                <input
                  type="email"
                  required
                  placeholder="rachel.a@enterprise.co"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Supabase will email a secure invitation link. The employee sets their own password.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations Specialist"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

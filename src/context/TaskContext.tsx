import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Task,
  TeamMember,
  NotificationItem,
  DoerScorecard,
  ProofSubmission,
  CorrectionRequest,
  VerificationRecord,
  ActivityLog,
  TaskStatus,
  MeetingDetails,
} from '../types';
import {
  OWNER_USER,
} from '../data/initialData';
import { supabase } from '../lib/supabase';

interface TaskContextType {
  tasks: Task[]; // Visible tasks strictly filtered by logged-in role
  allTasks: Task[]; // All tasks for system admin/scorecard calculation
  teamMembers: TeamMember[];
  ownerUser: TeamMember;
  currentUser: TeamMember;
  isAuthenticated: boolean;
  isLoading: boolean;
  dataError: string | null;
  notifications: NotificationItem[]; // Visible notifications strictly filtered by logged-in role
  unreadNotificationCount: number;
  doerScorecards: DoerScorecard[];
  
  // Auth & Session
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  changeLoginEmail: (email: string) => Promise<void>;
  
  // Admin User & Credential Management
  updateUserCredentials: (userId: string, updates: Partial<TeamMember>) => void;
  addNewTeamMember: (newMember: Omit<TeamMember, 'id' | 'authUserId'>) => Promise<TeamMember>;
  sendEmployeePasswordReset: (employeeId: string) => Promise<void>;
  deleteTeamMember: (userId: string) => Promise<void>;
  
  // Data Extraction & Backup
  exportAllDataJSON: () => string;
  exportTasksCSV: () => string;
  exportUsersCSV: () => string;
  importAllData: (jsonData: string) => boolean;

  // Task management
  createTask: (newTask: Omit<Task, 'id' | 'createdAt' | 'submissionHistory' | 'correctionHistory' | 'activityLogs'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  
  // Core Verification Workflow
  submitTaskProof: (taskId: string, proofData: {
    description: string;
    imageUrl?: string;
    imageCaption?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    timeSpentMinutes?: number;
    checklistCompleted?: string[];
  }) => void;
  
  verifyTask: (taskId: string, ownerNotes?: string) => void;
  
  requestCorrection: (taskId: string, feedback: string, specificIssues?: string[]) => void;
  
  toggleChecklistItem: (taskId: string, checklistId: string) => void;
  
  // Meeting Delegation & Email Dispatch Workflow
  dispatchMeetingLink: (
    taskId: string,
    params: {
      meetingLink: string;
      recipientEmails: string[];
      emailSubject: string;
      emailBody: string;
      method: 'MAIL_APP_OPENED' | 'DISPATCHED_IN_APP';
    }
  ) => void;
  
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

interface DatabaseProfile {
  id: string;
  employee_id: string;
  email: string;
  full_name: string;
  app_role: 'admin' | 'employee';
  data: {
    roleTitle?: string;
    department?: string;
    avatar?: string;
    accentColor?: string;
  } | null;
}

const getFunctionErrorMessage = async (error: { message: string; context?: unknown }) => {
  if (!(error.context instanceof Response)) return error.message;

  try {
    const responseBody: unknown = await error.context.clone().json();
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'error' in responseBody &&
      typeof responseBody.error === 'string'
    ) {
      return responseBody.error;
    }
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody &&
      typeof responseBody.message === 'string'
    ) {
      return responseBody.message;
    }
  } catch {
    // Keep the SDK error if the Edge Function did not return a JSON error body.
  }

  return error.message;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownerUser, setOwnerUser] = useState<TeamMember>(OWNER_USER);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(OWNER_USER.id);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const previousTasks = useRef<Task[] | null>(null);
  const previousNotifications = useRef<NotificationItem[] | null>(null);
  const previousProfiles = useRef<TeamMember[] | null>(null);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());

  // Current active user object
  const currentUser = useMemo(() => {
    if (currentUserId === ownerUser.id) return ownerUser;
    const found = teamMembers.find((m) => m.id === currentUserId);
    return found || ownerUser;
  }, [currentUserId, ownerUser, teamMembers]);

  useEffect(() => {
    let active = true;
    const applySession = (userId: string | null) => {
      setAuthUserId(userId);
      if (!userId) {
        setDataReady(false);
        setIsAuthenticated(false);
        setDataError(null);
        setCurrentUserId(OWNER_USER.id);
        setOwnerUser(OWNER_USER);
        setTeamMembers([]);
        setTasks([]);
        setNotifications([]);
        previousTasks.current = null;
        previousNotifications.current = null;
        previousProfiles.current = null;
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setDataError(error.message);
        setIsLoading(false);
        return;
      }
      applySession(data.session?.user.id ?? null);
      if (!data.session) setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) applySession(session?.user.id ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUserId) return;
    let active = true;
    setIsLoading(true);
    setDataReady(false);

    const loadRemoteData = async () => {
      const [profilesResult, tasksResult, notificationsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, employee_id, email, full_name, app_role, data')
          .order('full_name'),
        supabase.from('tasks').select('id, data'),
        supabase.from('notifications').select('id, recipient_employee_id, data'),
      ]);
      const failedResult = [profilesResult, tasksResult, notificationsResult].find(
        (result) => result.error
      );
      if (failedResult?.error) throw failedResult.error;
      if (!active) return;

      const profiles = (profilesResult.data || []) as DatabaseProfile[];
      const members = profiles.map((profile): TeamMember => ({
        id: profile.employee_id,
        authUserId: profile.id,
        name: profile.full_name || (profile.app_role === 'admin' ? OWNER_USER.name : profile.email.split('@')[0]),
        email: profile.email,
        roleTitle: profile.data?.roleTitle || (profile.app_role === 'admin' ? 'Owner & Administrator' : 'Team Specialist'),
        department: profile.data?.department || 'Operations',
        avatar: profile.data?.avatar || (profile.app_role === 'admin' ? OWNER_USER.avatar : ''),
        accentColor: profile.data?.accentColor || '#6366f1',
        isOwner: profile.app_role === 'admin',
      }));
      const owner = members.find((member) => member.isOwner);
      const employees = members.filter((member) => !member.isOwner);
      const loadedTasks = ((tasksResult.data || []) as Array<{ id: string; data: Task }>)
        .map((row) => row.data);
      const loadedNotifications = ((notificationsResult.data || []) as Array<{
        id: string;
        recipient_employee_id: string;
        data: NotificationItem;
      }>).map((row) => ({ ...row.data, id: row.id, recipientId: row.recipient_employee_id }));
      const activeMember = members.find((member) => member.authUserId === authUserId);
      if (!activeMember) {
        throw new Error('Your signed-in account has no DelegateOS profile. Contact the administrator.');
      }

      setOwnerUser(owner || OWNER_USER);
      setTeamMembers(employees);
      setTasks(loadedTasks);
      setNotifications(loadedNotifications);
      setCurrentUserId(activeMember.id);
      setIsAuthenticated(true);
      setDataError(null);
      previousTasks.current = loadedTasks;
      previousNotifications.current = loadedNotifications;
      previousProfiles.current = members;
      setDataReady(true);
    };

    loadRemoteData()
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unable to load data from Supabase.';
        setDataError(message);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authUserId]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setDataError(`Sign out failed: ${error.message}`);
  };

  const setPassword = async (password: string) => {
    if (!authUserId) {
      throw new Error('This password setup link is invalid or has expired. Request a new invitation.');
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  };

  const changeLoginEmail = async (email: string) => {
    if (!currentUser.isOwner) {
      throw new Error('Only the administrator can change the admin login email.');
    }
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) throw new Error(await getFunctionErrorMessage(error));
  };

  useEffect(() => {
    if (!dataReady) return;
    if (!previousTasks.current) {
      previousTasks.current = tasks;
      return;
    }

    const previousById = new Map(previousTasks.current.map((task) => [task.id, task]));
    const currentById = new Map(tasks.map((task) => [task.id, task]));
    const saveChanges = async () => {
      const writes = tasks
        .filter((task) => JSON.stringify(previousById.get(task.id)) !== JSON.stringify(task))
        .map(async (task) => {
          const assigneeEmployeeIds = getTaskAssigneeIds(task);
          const previous = previousById.get(task.id);
          const query = previous
            ? supabase
                .from('tasks')
                .update({ data: task, assignee_employee_ids: assigneeEmployeeIds })
                .eq('id', task.id)
            : supabase.from('tasks').insert({
                id: task.id,
                data: task,
                assignee_employee_ids: assigneeEmployeeIds,
                created_by: authUserId,
              });
          const { error } = await query;
          if (error) throw error;
        });
      for (const taskId of previousById.keys()) {
        if (!currentById.has(taskId)) {
          const { error } = await supabase.from('tasks').delete().eq('id', taskId);
          if (error) throw error;
        }
      }
      await Promise.all(writes);
    };

    previousTasks.current = tasks;
    persistenceQueue.current = persistenceQueue.current
      .then(saveChanges)
      .catch((error: unknown) => {
        setDataError(`Task save failed: ${error instanceof Error ? error.message : String(error)}`);
      });
  }, [tasks, dataReady, authUserId]);

  useEffect(() => {
    if (!dataReady) return;
    if (!previousNotifications.current) {
      previousNotifications.current = notifications;
      return;
    }

    const previousById = new Map(previousNotifications.current.map((item) => [item.id, item]));
    const currentById = new Map(notifications.map((item) => [item.id, item]));
    const saveChanges = async () => {
      const writes = notifications
        .filter((item) => JSON.stringify(previousById.get(item.id)) !== JSON.stringify(item))
        .map(async (item) => {
          const previous = previousById.get(item.id);
          const result = previous
            ? await supabase
                .from('notifications')
                .update({ data: item, recipient_employee_id: item.recipientId })
                .eq('id', item.id)
            : await supabase.from('notifications').insert({
                id: item.id,
                recipient_employee_id: item.recipientId,
                data: item,
              });
          if (result.error) throw result.error;
        });
      for (const id of previousById.keys()) {
        if (!currentById.has(id)) {
          const { error } = await supabase.from('notifications').delete().eq('id', id);
          if (error) throw error;
        }
      }
      await Promise.all(writes);
    };

    previousNotifications.current = notifications;
    persistenceQueue.current = persistenceQueue.current
      .then(saveChanges)
      .catch((error: unknown) => {
        setDataError(`Notification save failed: ${error instanceof Error ? error.message : String(error)}`);
      });
  }, [notifications, dataReady]);

  useEffect(() => {
    if (!dataReady) return;
    const profiles = [ownerUser, ...teamMembers];
    if (!previousProfiles.current) {
      previousProfiles.current = profiles;
      return;
    }

    const previousById = new Map(previousProfiles.current.map((member) => [member.id, member]));
    const changed = profiles.filter(
      (member) => JSON.stringify(previousById.get(member.id)) !== JSON.stringify(member)
    );
    previousProfiles.current = profiles;
    if (changed.length === 0) return;

    persistenceQueue.current = persistenceQueue.current
      .then(async () => {
        await Promise.all(changed.map(async (member) => {
          if (!currentUser.isOwner && member.id !== currentUser.id) return;
          if (!member.authUserId) return;
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: member.name,
              data: {
                roleTitle: member.roleTitle,
                department: member.department,
                avatar: member.avatar,
                accentColor: member.accentColor,
              },
            })
            .eq('id', member.authUserId);
          if (error) throw error;
        }));
      })
      .catch((error: unknown) => {
        setDataError(`Profile save failed: ${error instanceof Error ? error.message : String(error)}`);
      });
  }, [ownerUser, teamMembers, currentUser, dataReady]);

  useEffect(() => {
    if (!dataReady || !authUserId) return;
    const channel = supabase
      .channel(`delegateos-${authUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old.id as string | undefined;
          if (id) {
            setTasks((previous) => {
              const next = previous.filter((task) => task.id !== id);
              previousTasks.current = next;
              return next;
            });
          }
          return;
        }
        const row = payload.new as { id: string; data: Task };
        if (!row?.data) return;
        setTasks((previous) => {
          const index = previous.findIndex((task) => task.id === row.id);
          const next = index < 0
            ? [row.data, ...previous]
            : previous.map((task) => (task.id === row.id ? row.data : task));
          previousTasks.current = next;
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old.id as string | undefined;
          if (id) {
            setNotifications((previous) => {
              const next = previous.filter((item) => item.id !== id);
              previousNotifications.current = next;
              return next;
            });
          }
          return;
        }
        const row = payload.new as {
          id: string;
          recipient_employee_id: string;
          data: NotificationItem;
        };
        if (!row?.data) return;
        const item = { ...row.data, id: row.id, recipientId: row.recipient_employee_id };
        setNotifications((previous) => {
          const index = previous.findIndex((notification) => notification.id === row.id);
          const next = index < 0
            ? [item, ...previous]
            : previous.map((notification) => (notification.id === row.id ? item : notification));
          previousNotifications.current = next;
          return next;
        });
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setDataError(`Live updates unavailable: ${error?.message || status}. Refresh to reload current data.`);
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dataReady, authUserId]);

  // Profile fields are stored in Supabase; credentials remain managed by Supabase Auth.
  const updateUserCredentials = (
    userId: string,
    updates: Partial<Omit<TeamMember, 'id' | 'authUserId' | 'email' | 'isOwner'>>
  ) => {
    if (userId === ownerUser.id) {
      setOwnerUser((prev) => ({ ...prev, ...updates }));
      return;
    }

    setTeamMembers((prev) =>
      prev.map((member) => (member.id === userId ? { ...member, ...updates } : member))
    );
  };

  // Admin invitations are created by a server-side Edge Function so no admin secret
  // is exposed in the browser and employees set their own passwords.
  const addNewTeamMember = async (
    memberData: Omit<TeamMember, 'id' | 'authUserId'>
  ): Promise<TeamMember> => {
    const { data, error } = await supabase.functions.invoke('invite-employee', {
      body: {
        email: memberData.email,
        fullName: memberData.name,
        roleTitle: memberData.roleTitle,
        department: memberData.department,
        avatar: memberData.avatar,
        accentColor: memberData.accentColor,
      },
    });
    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (!data?.employeeId || !data?.userId) {
      throw new Error(data?.error || 'The invitation did not return an employee profile.');
    }
    const newMember: TeamMember = {
      ...memberData,
      id: data.employeeId,
      authUserId: data.userId,
      accentColor: memberData.accentColor || '#6366f1',
      avatar:
        memberData.avatar ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const deleteTeamMember = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke('invite-employee', {
      body: { action: 'delete', employeeId: userId },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    setTeamMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const sendEmployeePasswordReset = async (employeeId: string) => {
    const { data, error } = await supabase.functions.invoke('invite-employee', {
      body: { action: 'send-password-reset', employeeId },
    });
    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (data?.error) throw new Error(data.error);
    if (!data?.sent) throw new Error('Supabase did not confirm the password reset email request.');
  };

  // DATA EXTRACTION & BACKUP: Full Database JSON export
  const exportAllDataJSON = (): string => {
    const backupData = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      system: 'DelegateOS Executive Delegation System',
      owner: ownerUser,
      teamMembers,
      tasks,
      notifications,
    };
    return JSON.stringify(backupData, null, 2);
  };

  // DATA EXTRACTION: Tasks CSV export (Spreadsheet ready)
  const exportTasksCSV = (): string => {
    const headers = [
      'Task ID',
      'Title',
      'Type',
      'Status',
      'Priority',
      'Category',
      'Primary Doer',
      'Secondary Doer',
      'Sub-Secondary Doer',
      'Created At',
      'Due Date',
      'Verified At',
      'Verified By',
      'Score Awarded',
      'Time Spent (Mins)',
      'Proof Image URL',
      'Checklist Progress',
    ];

    const rows = tasks.map((t) => {
      const pDoer = teamMembers.find((m) => m.id === t.primaryDoerId)?.name || 'Unknown';
      const sDoer = teamMembers.find((m) => m.id === t.secondaryDoerId)?.name || 'Unknown';
      const subDoer = teamMembers.find((m) => m.id === t.subSecondaryDoerId)?.name || 'Unknown';
      const completedChk = t.checklist.filter((c) => c.completed).length;
      const totalChk = t.checklist.length;
      const chkProgress = `${completedChk}/${totalChk}`;

      return [
        `"${t.id}"`,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${t.type}"`,
        `"${t.status}"`,
        `"${t.priority}"`,
        `"${t.category || ''}"`,
        `"${pDoer}"`,
        `"${sDoer}"`,
        `"${subDoer}"`,
        `"${t.createdAt}"`,
        `"${t.dueDate}"`,
        `"${t.verificationRecord?.verifiedAt || ''}"`,
        `"${t.verificationRecord?.verifiedByOwnerName || ''}"`,
        `"${t.verificationRecord?.awardedScore || ''}"`,
        `"${t.currentSubmission?.timeSpentMinutes || ''}"`,
        `"${t.currentSubmission?.imageUrl || ''}"`,
        `"${chkProgress}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // DATA EXTRACTION: Users & Passwords CSV export
  const exportUsersCSV = (): string => {
    const headers = ['User ID', 'Name', 'Email Address', 'Role Title', 'Department', 'Access Level'];
    const allUsers = [
      ownerUser,
      ...teamMembers,
    ];

    const rows = allUsers.map((u) => {
      return [
        `"${u.id}"`,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${u.email}"`,
        `"${u.roleTitle}"`,
        `"${u.department}"`,
        `"${u.isOwner ? 'OWNER / ADMIN' : 'EMPLOYEE / DOER'}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Import task history only; auth accounts and profiles are managed separately.
  const importAllData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!currentUser.isOwner) {
        throw new Error('Only an administrator can import task data.');
      }
      if (!Array.isArray(parsed.tasks)) throw new Error('Backup file has no task list.');

      const existingMemberByEmail = new Map(
        [ownerUser, ...teamMembers].map((member) => [member.email.toLowerCase(), member.id])
      );
      const legacyIdMap = new Map<string, string>([['owner', ownerUser.id]]);
      if (parsed.owner?.id) legacyIdMap.set(parsed.owner.id, ownerUser.id);
      if (Array.isArray(parsed.teamMembers)) {
        for (const member of parsed.teamMembers) {
          if (typeof member.id !== 'string' || typeof member.email !== 'string') continue;
          const currentId = existingMemberByEmail.get(member.email.toLowerCase());
          if (currentId) legacyIdMap.set(member.id, currentId);
        }
      }

      const importedTasks = parsed.tasks.map((task: Task) => {
        const remap = (id: string) => {
          if (!id) return '';
          const mapped = legacyIdMap.get(id);
          if (!mapped) {
            throw new Error(`No Supabase employee account matches legacy assignee "${id}".`);
          }
          return mapped;
        };
        return {
          ...task,
          primaryDoerId: remap(task.primaryDoerId),
          secondaryDoerId: remap(task.secondaryDoerId),
          subSecondaryDoerId: remap(task.subSecondaryDoerId),
        };
      });

      const importedNotifications = Array.isArray(parsed.notifications)
        ? parsed.notifications.map((notification: NotificationItem) => ({
            ...notification,
            recipientId: legacyIdMap.get(notification.recipientId) || notification.recipientId,
          }))
        : [];
      setTasks(importedTasks);
      setNotifications(importedNotifications);
      return true;
    } catch (e) {
      setDataError(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  };

  // Add notification helper
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newItem: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const getTaskAssigneeIds = (task: Pick<Task, 'primaryDoerId' | 'secondaryDoerId' | 'subSecondaryDoerId'>) => {
    return [...new Set([task.primaryDoerId, task.secondaryDoerId, task.subSecondaryDoerId].filter(Boolean))];
  };

  // STRICT ACCESS CONTROL / DATA SEGREGATION:
  // When Owner logs in: sees all tasks across all doers.
  // When Employee logs in: strictly sees ONLY tasks where they are Primary, Secondary, or Sub-Secondary!
  // Any another person's task is NOT exposed.
  const visibleTasks = useMemo(() => {
    if (!isAuthenticated) return [];
    if (currentUser.isOwner) {
      return tasks; // Owner has full visibility
    }
    // Employee sees ONLY tasks they are part of:
    return tasks.filter(
      (t) =>
        t.primaryDoerId === currentUser.id ||
        t.secondaryDoerId === currentUser.id ||
        t.subSecondaryDoerId === currentUser.id
    );
  }, [tasks, currentUser, isAuthenticated]);

  // STRICT NOTIFICATION ISOLATION:
  const visibleNotifications = useMemo(() => {
    if (!isAuthenticated) return [];
    if (currentUser.isOwner) {
      return notifications.filter((n) => {
        const recipient = String(n.recipientId || '').toLowerCase();
        return recipient === 'owner' || n.recipientId === currentUser.id;
      });
    }
    return notifications.filter((n) => n.recipientId === currentUser.id);
  }, [notifications, currentUser, isAuthenticated]);

  // Create Task
  const createTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'submissionHistory' | 'correctionHistory' | 'activityLogs'>
  ): Task => {
    const primaryDoer = teamMembers.find((m) => m.id === taskData.primaryDoerId);
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      submissionHistory: [],
      correctionHistory: [],
      activityLogs: [
        {
          id: `act-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          action: 'CREATED',
          actorName: currentUser.name,
          actorId: currentUser.id,
          details: `Task created and delegated to ${primaryDoer?.name || 'Primary Doer'}.`,
        },
      ],
    };

    setTasks((prev) => [newTask, ...prev]);

    const assigneeIds = getTaskAssigneeIds(newTask);
    assigneeIds.forEach((assigneeId) => {
      addNotification({
        taskId: newTask.id,
        taskTitle: newTask.title,
        type: 'TASK_ASSIGNED',
        recipientId: assigneeId,
        title: `📋 New ${newTask.type === 'RECURRING' ? 'Recurring SOP' : 'Delegation'} Task Assigned`,
        message: `Owner ${ownerUser.name} assigned you: "${newTask.title}". Due: ${new Date(newTask.dueDate).toLocaleDateString()}.`,
        priority: newTask.priority === 'URGENT' ? 'URGENT' : 'NORMAL',
      });
    });

    return newTask;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setNotifications((prev) => prev.filter((n) => n.taskId !== taskId));
  };

  // Submit proof for a task
  const submitTaskProof = (
    taskId: string,
    proofData: {
      description: string;
      imageUrl?: string;
      imageCaption?: string;
      attachmentUrl?: string;
      attachmentName?: string;
      timeSpentMinutes?: number;
      checklistCompleted?: string[];
    }
  ) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        const isPrimary = currentUser.id === t.primaryDoerId;
        const isSecondary = currentUser.id === t.secondaryDoerId;
        const submitterRole = isPrimary
          ? 'PRIMARY'
          : isSecondary
          ? 'SECONDARY'
          : 'SUB_SECONDARY';

        const previousAttempts = t.submissionHistory.length;
        const attempt = previousAttempts + 1;

        const newSubmission: ProofSubmission = {
          submittedAt: new Date().toISOString(),
          submittedByMemberId: currentUser.id,
          submittedByRole: submitterRole,
          description: proofData.description,
          imageUrl: proofData.imageUrl,
          imageCaption: proofData.imageCaption,
          attachmentUrl: proofData.attachmentUrl,
          attachmentName: proofData.attachmentName,
          timeSpentMinutes: proofData.timeSpentMinutes,
          checklistCompleted: proofData.checklistCompleted,
          submissionAttempt: attempt,
        };

        const resolvedLatestCorrection = t.latestCorrection
          ? { ...t.latestCorrection, resolved: true }
          : undefined;

        const updatedLogs: ActivityLog[] = [
          ...t.activityLogs,
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: attempt > 1 ? 'RESUBMITTED' : 'SUBMITTED_FOR_VERIFICATION',
            actorName: currentUser.name,
            actorId: currentUser.id,
            details: `${currentUser.name} (${submitterRole}) submitted task completion proof${
              attempt > 1 ? ` (Re-submission #${attempt})` : ''
            }. Proof image & notes attached for Owner inspection.`,
          },
        ];

        const updatedChecklist = t.checklist.map((item) => {
          if (proofData.checklistCompleted?.includes(item.id)) {
            return { ...item, completed: true };
          }
          return item;
        });

        return {
          ...t,
          status: 'SUBMITTED_FOR_VERIFICATION' as TaskStatus,
          currentSubmission: newSubmission,
          submissionHistory: [...t.submissionHistory, newSubmission],
          latestCorrection: resolvedLatestCorrection,
          checklist: updatedChecklist,
          activityLogs: updatedLogs,
        };
      })
    );

    // Alert Owner for verification
    const targetTask = tasks.find((t) => t.id === taskId);
    addNotification({
      taskId,
      taskTitle: targetTask?.title || 'Delegated Task',
      type: 'SUBMITTED_FOR_REVIEW',
      recipientId: 'owner',
      title: `🔍 Verification Required: ${currentUser.name} submitted proof`,
      message: `${currentUser.name} submitted task proof for "${targetTask?.title || 'Task'}". Check image proof and verify or request correction.`,
      priority: 'HIGH',
    });
  };

  // Verify task (Owner Action)
  const verifyTask = (taskId: string, ownerNotes?: string) => {
    let affectedAssigneeIds: string[] = [];
    let taskTitle = '';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        affectedAssigneeIds = getTaskAssigneeIds(t);
        taskTitle = t.title;

        const isFirstAttempt = t.submissionHistory.length <= 1;
        const awardedScore = isFirstAttempt ? 100 : 85;

        const verificationRecord: VerificationRecord = {
          verifiedAt: new Date().toISOString(),
          verifiedByOwnerName: currentUser.name,
          ownerNotes: ownerNotes || 'Verified and approved with complete satisfaction.',
          awardedScore,
        };

        const updatedLogs: ActivityLog[] = [
          ...t.activityLogs,
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'VERIFIED',
            actorName: currentUser.name,
            actorId: currentUser.id,
            details: `Owner ${currentUser.name} inspected proof, verified completion (${awardedScore}/100 pts). Task officially stamped Done.`,
          },
        ];

        let updatedRecurrence = t.recurrence;
        if (t.type === 'RECURRING' && t.recurrence) {
          const now = new Date();
          let nextDue = new Date(now);
          if (t.recurrence.frequency === 'DAILY') {
            nextDue.setDate(now.getDate() + 1);
          } else if (t.recurrence.frequency === 'WEEKLY') {
            nextDue.setDate(now.getDate() + 7);
          } else if (t.recurrence.frequency === 'BIWEEKLY') {
            nextDue.setDate(now.getDate() + 14);
          } else if (t.recurrence.frequency === 'MONTHLY') {
            nextDue.setMonth(now.getMonth() + 1);
          }

          updatedRecurrence = {
            ...t.recurrence,
            streakCount: (t.recurrence.streakCount || 0) + 1,
            lastCompletedDate: now.toISOString(),
            nextDueDate: nextDue.toISOString(),
          };
        }

        return {
          ...t,
          status: 'VERIFIED_DONE' as TaskStatus,
          verificationRecord,
          recurrence: updatedRecurrence,
          activityLogs: updatedLogs,
        };
      })
    );

    // Notify every assignee in the delegation chain so the backup roles remain informed.
    affectedAssigneeIds.forEach((recipientId) => {
      if (!recipientId) return;
      addNotification({
        taskId,
        taskTitle,
        type: 'TASK_VERIFIED',
        recipientId,
        title: `🎉 Task Verified & Approved by Owner!`,
        message: `Owner ${currentUser.name} has inspected the proof for "${taskTitle}" and marked it as Verified & Done! Quality points credited to the scorecard.`,
        priority: 'NORMAL',
      });
    });
  };

  // Request Correction (Owner Action)
  const requestCorrection = (taskId: string, feedback: string, specificIssues: string[] = []) => {
    let affectedAssigneeIds: string[] = [];
    let taskTitle = '';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        affectedAssigneeIds = getTaskAssigneeIds(t);
        taskTitle = t.title;

        const correctionReq: CorrectionRequest = {
          requestedAt: new Date().toISOString(),
          requestedByOwnerName: currentUser.name,
          feedback,
          specificIssues,
          resolved: false,
        };

        const updatedLogs: ActivityLog[] = [
          ...t.activityLogs,
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'CORRECTION_REQUESTED',
            actorName: currentUser.name,
            actorId: currentUser.id,
            details: `Owner requested task correction: "${feedback}". Task returned to Doer for revision.`,
          },
        ];

        return {
          ...t,
          status: 'NEEDS_CORRECTION' as TaskStatus,
          latestCorrection: correctionReq,
          correctionHistory: [...t.correctionHistory, correctionReq],
          activityLogs: updatedLogs,
        };
      })
    );

    // Notify every assignee in the delegation chain, with the primary assignee receiving the urgent revision notice.
    affectedAssigneeIds.forEach((recipientId) => {
      if (!recipientId) return;
      addNotification({
        taskId,
        taskTitle,
        type: 'CORRECTION_REQUESTED',
        recipientId,
        title: `⚠️ Task Correction Required: Feedback on "${taskTitle}"`,
        message: `Owner ${currentUser.name} requested fixes: "${feedback}". Please update proof and resubmit.`,
        priority: recipientId === affectedAssigneeIds[0] ? 'URGENT' : 'HIGH',
      });
    });
  };

  const toggleChecklistItem = (taskId: string, checklistId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          checklist: t.checklist.map((item) =>
            item.id === checklistId ? { ...item, completed: !item.completed } : item
          ),
        };
      })
    );
  };

  // MEETING DELEGATION WORKFLOW: Primary Doer dispatches meeting link to Secondary and Sub-Sec Doers
  const dispatchMeetingLink = (
    taskId: string,
    params: {
      meetingLink: string;
      recipientEmails: string[];
      emailSubject: string;
      emailBody: string;
      method: 'MAIL_APP_OPENED' | 'DISPATCHED_IN_APP';
    }
  ) => {
    let taskTitle = '';
    let meetingType = '';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        taskTitle = t.title;
        meetingType = t.meetingDetails?.meetingTypeLabel || 'Meeting';

        const updatedMeetingDetails: MeetingDetails = {
          ...(t.meetingDetails || {
            isMeeting: true,
            meetingType: 'PURCHASE_MEETING',
            meetingTypeLabel: 'Purchase Meeting',
          }),
          isMeeting: true,
          linkDispatched: true,
          meetingLink: params.meetingLink,
          dispatchedAt: new Date().toISOString(),
          dispatchedByMemberId: currentUser.id,
          dispatchedByMemberName: currentUser.name,
          recipientEmails: params.recipientEmails,
          emailSubject: params.emailSubject,
          emailBody: params.emailBody,
          emailDispatchLogs: [
            ...(t.meetingDetails?.emailDispatchLogs || []),
            {
              timestamp: new Date().toISOString(),
              sentBy: currentUser.name,
              sentByEmail: currentUser.email,
              recipients: params.recipientEmails,
              meetingLink: params.meetingLink,
              method: params.method,
            },
          ],
        };

        // Automatically mark any checklist item relating to meeting link as completed
        const updatedChecklist = t.checklist.map((item) => {
          const lower = item.title.toLowerCase();
          if (
            lower.includes('meeting link') ||
            lower.includes('dispatch') ||
            lower.includes('send link') ||
            lower.includes('email')
          ) {
            return { ...item, completed: true };
          }
          return item;
        });

        const updatedLogs: ActivityLog[] = [
          ...t.activityLogs,
          {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'MEETING_LINK_DISPATCHED',
            actorName: currentUser.name,
            actorId: currentUser.id,
            details: `${currentUser.name} dispatched ${meetingType} link (${params.meetingLink}) via email to ${
              params.recipientEmails.length
            } recipient(s): ${params.recipientEmails.join(', ')} (${
              params.method === 'MAIL_APP_OPENED' ? 'Opened in Default Email App' : 'Dispatched via DelegateOS Mailer'
            }).`,
          },
        ];

        return {
          ...t,
          meetingDetails: updatedMeetingDetails,
          checklist: updatedChecklist,
          activityLogs: updatedLogs,
        };
      })
    );

    // Notify each matching team member
    params.recipientEmails.forEach((email) => {
      const matchedMember = teamMembers.find(
        (m) => m.email.toLowerCase() === email.toLowerCase()
      );
      if (matchedMember && matchedMember.id !== currentUser.id) {
        addNotification({
          taskId,
          taskTitle,
          type: 'MEETING_LINK_DISPATCHED',
          recipientId: matchedMember.id,
          title: `📹 Meeting Link Received: ${meetingType}`,
          message: `${currentUser.name} sent you the video conference link for "${taskTitle}". Link: ${params.meetingLink}`,
          priority: 'HIGH',
        });
      }
    });

    // Notify Owner
    if (!currentUser.isOwner) {
      addNotification({
        taskId,
        taskTitle,
        type: 'MEETING_LINK_DISPATCHED',
        recipientId: 'owner',
        title: `✉️ Meeting Link Sent by ${currentUser.name}`,
        message: `Primary Doer ${currentUser.name} dispatched the meeting link for "${taskTitle}" to ${params.recipientEmails.join(
          ', '
        )}.`,
        priority: 'NORMAL',
      });
    }
  };

  // Notification helpers
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.recipientId === currentUser.id || (currentUser.isOwner && n.recipientId === 'owner')
          ? { ...n, read: true }
          : n
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Calculate Doer Scorecards
  const doerScorecards: DoerScorecard[] = useMemo(() => {
    return teamMembers.map((member) => {
      const primaryTasks = tasks.filter((t) => t.primaryDoerId === member.id);
      const secondaryTasks = tasks.filter((t) => t.secondaryDoerId === member.id);
      const subSecondaryTasks = tasks.filter((t) => t.subSecondaryDoerId === member.id);
      const allAssignedTasks = Array.from(
        new Map(
          [...primaryTasks, ...secondaryTasks, ...subSecondaryTasks].map((task) => [task.id, task])
        ).values()
      );

      const verified = allAssignedTasks.filter((t) => t.status === 'VERIFIED_DONE');
      const pendingVerification = allAssignedTasks.filter((t) => t.status === 'SUBMITTED_FOR_VERIFICATION');
      const needsCorrection = allAssignedTasks.filter((t) => t.status === 'NEEDS_CORRECTION');
      const inProgress = allAssignedTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING');

      const verifiedFirstAttempt = verified.filter((t) => t.correctionHistory.length === 0);

      const firstAttemptApprovalRate =
        verified.length > 0
          ? Math.round((verifiedFirstAttempt.length / verified.length) * 100)
          : 90;

      const onTimeCount = verified.filter((t) => {
        if (!t.verificationRecord?.verifiedAt) return true;
        return new Date(t.verificationRecord.verifiedAt) <= new Date(t.dueDate);
      }).length;
      const onTimeRate =
        verified.length > 0 ? Math.round((onTimeCount / verified.length) * 100) : 95;

      let baseScore = 75;
      baseScore += Math.min(verified.length * 7, 20);
      baseScore += (firstAttemptApprovalRate - 80) * 0.25;
      baseScore -= needsCorrection.length * 10;
      const overallAccountabilityScore = Math.max(35, Math.min(99, Math.round(baseScore)));

      return {
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        roleTitle: member.roleTitle,
        totalAssignedPrimary: primaryTasks.length,
        totalAssignedSecondary: secondaryTasks.length,
        totalAssignedSubSecondary: subSecondaryTasks.length,
        totalCompletedAndVerified: verified.length,
        pendingVerificationCount: pendingVerification.length,
        needsCorrectionCount: needsCorrection.length,
        inProgressCount: inProgress.length,
        verifiedFirstAttemptCount: verifiedFirstAttempt.length,
        firstAttemptApprovalRate,
        onTimeCompletionRate: onTimeRate,
        overallAccountabilityScore,
      };
    });
  }, [tasks, teamMembers]);

  const unreadNotificationCount = useMemo(() => {
    return visibleNotifications.filter((n) => !n.read).length;
  }, [visibleNotifications]);

  return (
    <TaskContext.Provider
      value={{
        tasks: visibleTasks, // Strictly isolated per user!
        allTasks: tasks,
        teamMembers,
        ownerUser,
        currentUser,
        isAuthenticated,
        isLoading,
        dataError,
        notifications: visibleNotifications, // Strictly isolated per user!
        unreadNotificationCount,
        doerScorecards,
        login,
        logout,
        setPassword,
        changeLoginEmail,
        updateUserCredentials,
        addNewTeamMember,
        sendEmployeePasswordReset,
        deleteTeamMember,
        exportAllDataJSON,
        exportTasksCSV,
        exportUsersCSV,
        importAllData,
        createTask,
        updateTask,
        deleteTask,
        submitTaskProof,
        verifyTask,
        requestCorrection,
        toggleChecklistItem,
        dispatchMeetingLink,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

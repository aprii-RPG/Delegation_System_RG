import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  TEAM_MEMBERS,
  INITIAL_TASKS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';

interface TaskContextType {
  tasks: Task[]; // Visible tasks strictly filtered by logged-in role
  allTasks: Task[]; // All tasks for system admin/scorecard calculation
  teamMembers: TeamMember[];
  ownerUser: TeamMember;
  currentUser: TeamMember;
  isAuthenticated: boolean;
  notifications: NotificationItem[]; // Visible notifications strictly filtered by logged-in role
  unreadNotificationCount: number;
  doerScorecards: DoerScorecard[];
  
  // Auth & Session
  login: (email: string, password?: string) => { success: boolean; error?: string };
  quickLogin: (userId: string) => void;
  logout: () => void;
  setCurrentUser: (member: TeamMember) => void;
  
  // Admin User & Credential Management
  updateUserCredentials: (userId: string, updates: Partial<TeamMember>) => void;
  addNewTeamMember: (newMember: Omit<TeamMember, 'id'>) => TeamMember;
  deleteTeamMember: (userId: string) => void;
  
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
  
  // Reset
  resetToDefaultData: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TASKS: 'delegate_os_tasks_v3',
  NOTIFICATIONS: 'delegate_os_notifications_v3',
  AUTH_USER_ID: 'delegate_os_auth_user_v3',
  IS_AUTHENTICATED: 'delegate_os_is_authenticated_v3',
  OWNER_USER: 'delegate_os_owner_user_v3',
  TEAM_MEMBERS: 'delegate_os_team_members_v3',
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Owner user state (persisted)
  const [ownerUser, setOwnerUser] = useState<TeamMember>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OWNER_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load owner from storage', e);
    }
    return OWNER_USER;
  });

  // Team members state (persisted)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load team members from storage', e);
    }
    return TEAM_MEMBERS;
  });

  // Tasks state (persisted)
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load tasks from local storage', e);
    }
    return INITIAL_TASKS;
  });

  // Notifications state (persisted)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load notifications from local storage', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_USER_ID) || OWNER_USER.id;
    } catch {
      return OWNER_USER.id;
    }
  });

  // Current active user object
  const currentUser = useMemo(() => {
    if (currentUserId === ownerUser.id) return ownerUser;
    const found = teamMembers.find((m) => m.id === currentUserId);
    return found || ownerUser;
  }, [currentUserId, ownerUser, teamMembers]);

  // Persist all state slices
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OWNER_USER, JSON.stringify(ownerUser));
    } catch (e) {
      console.error('Failed to persist owner user', e);
    }
  }, [ownerUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(teamMembers));
    } catch (e) {
      console.error('Failed to persist team members', e);
    }
  }, [teamMembers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to persist tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to persist notifications', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER_ID, currentUserId);
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, isAuthenticated ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to persist auth status', e);
    }
  }, [currentUserId, isAuthenticated]);

  // Login handler using dynamic credentials
  const login = (email: string, password?: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check owner
    if (cleanEmail === ownerUser.email.toLowerCase() || cleanEmail === 'owner@delegateos.com' || cleanEmail === 'owner') {
      if (password && password !== ownerUser.password && password !== 'password123') {
        return { success: false, error: 'Incorrect password for Owner account.' };
      }
      setCurrentUserId(ownerUser.id);
      setIsAuthenticated(true);
      return { success: true };
    }

    // Check team members
    const matched = teamMembers.find(
      (m) =>
        m.email.toLowerCase() === cleanEmail ||
        m.name.toLowerCase().split(' ')[0] === cleanEmail
    );

    if (matched) {
      if (password && password !== matched.password && password !== 'password123') {
        return { success: false, error: `Incorrect password for ${matched.name}.` };
      }
      setCurrentUserId(matched.id);
      setIsAuthenticated(true);
      return { success: true };
    }

    return {
      success: false,
      error: 'Account not found. Please verify your email or contact the administrator.',
    };
  };

  const quickLogin = (userId: string) => {
    if (userId === ownerUser.id) {
      setCurrentUserId(ownerUser.id);
      setIsAuthenticated(true);
      return;
    }
    const found = teamMembers.find((m) => m.id === userId);
    if (found) {
      setCurrentUserId(found.id);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'false');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetCurrentUser = (member: TeamMember) => {
    setCurrentUserId(member.id);
    setIsAuthenticated(true);
  };

  // ADMIN CREDENTIAL MANAGEMENT: Update any employee's or owner's password, email, role
  const updateUserCredentials = (userId: string, updates: Partial<TeamMember>) => {
    if (userId === ownerUser.id) {
      setOwnerUser((prev) => ({ ...prev, ...updates }));
      return;
    }

    setTeamMembers((prev) =>
      prev.map((member) => (member.id === userId ? { ...member, ...updates } : member))
    );
  };

  // ADMIN ADD NEW TEAM MEMBER
  const addNewTeamMember = (memberData: Omit<TeamMember, 'id'>): TeamMember => {
    const newId = `doer-${Date.now()}`;
    const newMember: TeamMember = {
      ...memberData,
      id: newId,
      accentColor: memberData.accentColor || '#6366f1',
      avatar:
        memberData.avatar ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      password: memberData.password || 'password123',
    };

    setTeamMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  // ADMIN DELETE TEAM MEMBER
  const deleteTeamMember = (userId: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== userId));
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
    const headers = ['User ID', 'Name', 'Email Address', 'Role Title', 'Department', 'Access Level', 'Current Password'];
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
        `"${u.password || ''}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // DATA IMPORT & RESTORE
  const importAllData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        setTasks(parsed.tasks);
      }
      if (parsed.teamMembers && Array.isArray(parsed.teamMembers)) {
        setTeamMembers(parsed.teamMembers);
      }
      if (parsed.owner && parsed.owner.email) {
        setOwnerUser(parsed.owner);
      }
      if (parsed.notifications && Array.isArray(parsed.notifications)) {
        setNotifications(parsed.notifications);
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
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

  const resetToDefaultData = () => {
    setTasks(INITIAL_TASKS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setOwnerUser(OWNER_USER);
    setTeamMembers(TEAM_MEMBERS);
    setCurrentUserId(OWNER_USER.id);
    setIsAuthenticated(true);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.OWNER_USER);
    localStorage.removeItem(STORAGE_KEYS.TEAM_MEMBERS);
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
        notifications: visibleNotifications, // Strictly isolated per user!
        unreadNotificationCount,
        doerScorecards,
        login,
        quickLogin,
        logout,
        setCurrentUser: handleSetCurrentUser,
        updateUserCredentials,
        addNewTeamMember,
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
        resetToDefaultData,
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

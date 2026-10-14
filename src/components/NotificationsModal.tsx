import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Check,
  Send,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem, Task } from '../types';
import { useTasks } from '../context/TaskContext';

interface NotificationsModalProps {
  onClose: () => void;
  onSelectTask: (task: Task) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  onSelectTask,
}) => {
  const {
    notifications,
    tasks,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useTasks();

  const [filter, setFilter] = useState<'ALL' | 'CORRECTIONS' | 'VERIFICATIONS'>('ALL');

  // Filter notifications for current user (or all if owner)
  const myNotifications = notifications.filter((n) => {
    if (currentUser.isOwner) {
      return n.recipientId === currentUser.id || String(n.recipientId || '').toLowerCase() === 'owner';
    }
    return n.recipientId === currentUser.id;
  });

  const filtered = myNotifications.filter((n) => {
    if (filter === 'CORRECTIONS') return n.type === 'CORRECTION_REQUESTED';
    if (filter === 'VERIFICATIONS') return n.type === 'TASK_VERIFIED';
    return true;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationRead(item.id);
    const target = tasks.find((t) => t.id === item.taskId);
    if (target) {
      onSelectTask(target);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  REAL-TIME NOTIFICATION DISPATCH
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {currentUser.name}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">Notifications & Alerts</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 text-xs">
          <div className="flex space-x-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All ({myNotifications.length})
            </button>
            <button
              onClick={() => setFilter('CORRECTIONS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'CORRECTIONS'
                  ? 'bg-amber-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              ⚠️ Corrections
            </button>
            <button
              onClick={() => setFilter('VERIFICATIONS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'VERIFICATIONS'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              ✓ Verifications
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-slate-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={clearNotifications}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No notifications matching this filter.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isCorrection = item.type === 'CORRECTION_REQUESTED';
              const isVerified = item.type === 'TASK_VERIFIED';
              const isReviewRequired = item.type === 'SUBMITTED_FOR_REVIEW';

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    !item.read
                      ? isCorrection
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-950/20'
                        : isVerified
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                        : isReviewRequired
                        ? 'bg-purple-950/20 border-purple-500/40 shadow-sm shadow-purple-950/20'
                        : 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      {isCorrection ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-400/40" />
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed pl-6">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pl-6">
                    <span className="truncate max-w-xs text-slate-400">
                      Task: {item.taskTitle}
                    </span>
                    <span className="text-indigo-400 font-medium hover:underline flex items-center space-x-1">
                      <span>Jump to Task</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

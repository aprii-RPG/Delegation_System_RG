import React, { useState } from 'react';
import {
  X,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Users,
  Target,
  Sparkles,
  BarChart3,
  Camera,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TeamMember } from '../types';
import { EditAvatarModal } from './EditAvatarModal';

interface DoerScorecardsModalProps {
  onClose: () => void;
}

export const DoerScorecardsModal: React.FC<DoerScorecardsModalProps> = ({ onClose }) => {
  const { doerScorecards, teamMembers, tasks, currentUser } = useTasks();
  const [selectedMemberForAvatar, setSelectedMemberForAvatar] = useState<TeamMember | null>(null);

  // Sort by accountability score descending
  const sortedScorecards = [...doerScorecards].sort(
    (a, b) => b.overallAccountabilityScore - a.overallAccountabilityScore
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                TEAM ACCOUNTABILITY INDEX & PERFORMANCE SCORECARDS
              </span>
              <h2 className="text-lg font-bold text-white">
                4 Doers Evaluation & Verification Metrics
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
          {/* Executive Overview Banner */}
          <div className="bg-linear-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/50 p-5 rounded-2xl border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Accountability Score Calculation Formula</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Evaluates 1st-attempt proof verification rate, on-time SLA completion, and penalizes rework corrections. Used by executive management to assess delegation reliability.
                </p>
              </div>
              <div className="flex items-center space-x-4 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Team Avg</span>
                  <span className="text-lg font-black text-indigo-400 font-mono">
                    {Math.round(
                      sortedScorecards.reduce((acc, c) => acc + c.overallAccountabilityScore, 0) /
                        sortedScorecards.length
                    )}
                    %
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Verified</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {sortedScorecards.reduce((acc, c) => acc + c.totalCompletedAndVerified, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of 4 Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedScorecards.map((card, index) => {
              const member = teamMembers.find((m) => m.id === card.memberId);
              const isCurrentSessionUser = card.memberId === currentUser.id;

              return (
                <div
                  key={card.memberId}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-md relative overflow-hidden ${
                    isCurrentSessionUser
                      ? 'bg-linear-to-b from-indigo-950/40 via-slate-950 to-slate-950 border-indigo-500 shadow-lg shadow-indigo-950/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isCurrentSessionUser && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-lg font-mono">
                      Your Account
                    </div>
                  )}

                  {/* Top Rank Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        onClick={() => member && setSelectedMemberForAvatar(member)}
                        className="relative cursor-pointer group shrink-0"
                        title={`Click to customize photo for ${card.memberName}`}
                      >
                        <img
                          src={card.avatar}
                          alt={card.memberName}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700 group-hover:ring-indigo-400 transition-all bg-slate-800"
                        />
                        <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Camera className="w-4 h-4 text-indigo-300" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-sm font-bold text-white">{card.memberName}</h4>
                          <button
                            type="button"
                            onClick={() => member && setSelectedMemberForAvatar(member)}
                            className="text-slate-500 hover:text-indigo-300 p-0.5 rounded transition-colors"
                            title="Edit Avatar"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-400 block truncate max-w-45">
                          {card.roleTitle}
                        </span>
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="text-right">
                      <div
                        className={`text-2xl font-black font-mono ${
                          card.overallAccountabilityScore >= 90
                            ? 'text-emerald-400'
                            : card.overallAccountabilityScore >= 75
                            ? 'text-indigo-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {card.overallAccountabilityScore}
                        <span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Accountability
                      </span>
                    </div>
                  </div>

                  {/* Core Metrics Bar */}
                  <div className="space-y-3 mb-4">
                    {/* First Attempt Approval Rate */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">1st-Attempt Approval Rate:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {card.firstAttemptApprovalRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${card.firstAttemptApprovalRate}%` }}
                        />
                      </div>
                    </div>

                    {/* On-Time Rate */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">On-Time Execution SLA:</span>
                        <span className="font-bold text-indigo-400 font-mono">
                          {card.onTimeCompletionRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${card.onTimeCompletionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-900 text-center">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Verified</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {card.totalCompletedAndVerified}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Review</span>
                      <span className="text-xs font-bold text-purple-400 font-mono">
                        {card.pendingVerificationCount}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Corrections</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          card.needsCorrectionCount > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {card.needsCorrectionCount}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">In Progress</span>
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        {card.inProgressCount}
                      </span>
                    </div>
                  </div>

                  {/* 3-Tier Delegation Involvement */}
                  <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Delegation Load:</span>
                    <span className="font-mono text-slate-300">
                      Primary: <strong className="text-indigo-400">{card.totalAssignedPrimary}</strong> • Secondary: {card.totalAssignedSecondary} • Sub: {card.totalAssignedSubSecondary}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Scorecards
          </button>
        </div>
      </div>

      {/* Edit Avatar Modal */}
      {selectedMemberForAvatar && (
        <EditAvatarModal
          user={selectedMemberForAvatar}
          onClose={() => setSelectedMemberForAvatar(null)}
        />
      )}
    </div>
  );
};

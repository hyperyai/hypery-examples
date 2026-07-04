/**
 * Task Progress Component
 * Shows TODO list with real-time step updates
 */

'use client';

import { useState } from 'react';
import { AgentTask, AgentStep } from '@/lib/agents/orchestrator';
import { CheckCircle2, Circle, Loader2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskProgressProps {
  task: AgentTask;
}

export function TaskProgress({ task }: TaskProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const getStepIcon = (status: AgentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-[var(--accent-primary)] animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  const getStepColor = (status: AgentStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'waiting':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-[var(--text-disabled)] bg-gray-50 border-[var(--border-secondary)]';
    }
  };

  const completedSteps = task.steps.filter(s => s.status === 'completed').length;
  const totalSteps = task.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="border rounded-lg bg-[var(--bg-secondary)] shadow-sm">
      {/* Task Header (Always visible, clickable) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between p-3 hover:bg-gray-50 ide-transition"
      >
        <div className="flex-1 flex items-center space-x-3 min-w-0">
          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-disabled)] flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-disabled)] flex-shrink-0" />
          )}
          
          {/* Progress Bar (Inline) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">{task.description}</h4>
              <span className="text-xs text-[var(--text-disabled)] flex-shrink-0">
                {completedSteps}/{totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[var(--accent-hover)] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`
          px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ml-2
          ${task.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
          ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
          ${task.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
          ${task.status === 'pending' ? 'bg-[var(--bg-tertiary)] text-gray-700' : ''}
        `}>
          {task.status.replace('_', ' ')}
        </div>
      </button>

      {/* Steps List (TODO List) - Collapsible */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
          {task.steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                flex items-start space-x-2 p-2 rounded border transition-all text-sm
                ${getStepColor(step.status)}
              `}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-xs">{index + 1}.</span>
                  <span className="font-mono text-xs">{step.tool}</span>
                  {step.parallel && (
                    <span className="px-1 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                      ∥
                    </span>
                  )}
                </div>

                {/* Waiting Info */}
                {step.status === 'waiting' && (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    ⏳ Waiting...
                  </p>
                )}

                {/* Error */}
                {step.error && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">
                    {step.error}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Task Error */}
          {task.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-700">
                <span className="font-medium">Error:</span> {task.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


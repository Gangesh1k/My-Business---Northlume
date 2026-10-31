import React, { useState, useEffect } from 'react';
import { workflowNodes } from '../data/siteData';
import { WorkflowNode } from '../types';
import { 
  Mail, 
  FileSpreadsheet, 
  Cpu, 
  GitBranch, 
  Zap, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';

interface HeroWorkflowVisualProps {
  onRunDemo?: () => void;
}

export const HeroWorkflowVisual: React.FC<HeroWorkflowVisualProps> = ({ onRunDemo }) => {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode>(workflowNodes[2]); // Default AI node
  const [activeFlowIndex, setActiveFlowIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Cycle through nodes to show the data pulse moving
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveFlowIndex((prev) => (prev + 1) % workflowNodes.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const getIcon = (iconName: string, className: string = "w-5 h-5") => {
    switch (iconName) {
      case 'Mail': return <Mail className={className} />;
      case 'FileSpreadsheet': return <FileSpreadsheet className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'GitBranch': return <GitBranch className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'CheckCircle2': return <CheckCircle2 className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  return (
    <div id="hero-workflow-visual" className="w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
              Live Workflow Architecture Simulation
            </h3>
            <p className="text-[11px] text-slate-500">
              Interactive end-to-end operational pipeline (Hover or tap any stage)
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-full transition-colors"
            title={isAutoPlaying ? "Pause flow" : "Resume flow"}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-3 h-3 text-slate-600" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-teal-600 fill-teal-600" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setActiveFlowIndex(0);
              setSelectedNode(workflowNodes[0]);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/70 rounded-full transition-colors"
            title="Reset to Stage 1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Horizontal / Wrapped Workflow Nodes Pipeline */}
      <div className="py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 relative">
          {workflowNodes.map((node, index) => {
            const isSelected = selectedNode.id === node.id;
            const isPulsing = activeFlowIndex === index;

            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNode(node);
                  setActiveFlowIndex(index);
                }}
                onMouseEnter={() => {
                  setSelectedNode(node);
                }}
                className={`relative group text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/30'
                    : isPulsing
                    ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-xs'
                    : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {/* Active step number & badge */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-slate-800 text-teal-300'
                        : isPulsing
                        ? 'bg-teal-200/80 text-teal-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {node.shortCode}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider ${
                      isSelected ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {node.badge}
                  </span>
                </div>

                {/* Node Icon & Name */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-teal-500/20 text-teal-300'
                        : isPulsing
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-slate-700 shadow-xs'
                    }`}
                  >
                    {getIcon(node.iconName, 'w-4 h-4')}
                  </div>
                  <span
                    className={`font-bold text-xs tracking-tight ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {node.name}
                  </span>
                </div>

                {/* Flow indicator light */}
                <div className="w-full mt-2 pt-1.5 border-t border-dashed border-slate-200/40 flex items-center justify-between text-[10px]">
                  <span className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {node.description.slice(0, 24)}...
                  </span>
                  {index < workflowNodes.length - 1 && (
                    <ArrowRight
                      className={`w-3 h-3 shrink-0 ml-1 ${
                        isPulsing ? 'text-teal-600 animate-pulse' : 'text-slate-300'
                      }`}
                    />
                  )}
                </div>

                {/* Active Animated Pip on the border */}
                {isPulsing && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Explanation Card (Interactive Details) */}
      <div className="mt-2 bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0 mt-0.5">
            {getIcon(selectedNode.iconName, 'w-6 h-6')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                Stage {selectedNode.shortCode}: {selectedNode.name}
              </span>
              <span className="text-xs text-slate-400">({selectedNode.badge})</span>
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-white mt-0.5">
              {selectedNode.description}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {selectedNode.details}
            </p>
          </div>
        </div>

        {/* Action Anchor */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <a
            href="#demo"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Simulate Full Run</span>
          </a>
        </div>
      </div>
    </div>
  );
};

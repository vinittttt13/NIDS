import React from 'react';
import { useNids } from '../context/NidsContext';
import { ModelHealthCard } from '../components/ai/ModelHealthCard';
import { ModelMetricsGrid } from '../components/ai/ModelMetricsGrid';
import { RealtimeInferenceCard } from '../components/ai/RealtimeInferenceCard';
import { ClassProbabilityBars } from '../components/ai/ClassProbabilityBars';
import { PipelineVisualizer } from '../components/ai/PipelineVisualizer';
import { FeatureImportanceChart } from '../components/ai/FeatureImportanceChart';
import { FeatureTable } from '../components/ai/FeatureTable';

export const AiEnginePage: React.FC = () => {
  const { modelStats, aiInference } = useNids();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1b273d]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-wide font-sans">
              AI Intrusion Detection Engine
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              XGBOOST v1.4 + ISOLATION FOREST
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervised multi-class traffic classification, unsupervised outlier scoring, and explainable feature attribution
          </p>
        </div>
      </div>

      {/* Model Health Overview */}
      <ModelHealthCard stats={modelStats} />

      {/* Model Benchmark Performance Metrics Grid */}
      <ModelMetricsGrid stats={modelStats} />

      {/* Dominant Real-Time Inference Card (Section #14) */}
      <RealtimeInferenceCard inference={aiInference} />

      {/* Class Probabilities & Feature Importance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClassProbabilityBars probabilities={aiInference.probabilities} />
        <FeatureImportanceChart />
      </div>

      {/* 6-Stage Processing Pipeline Visualizer (Section #16) */}
      <PipelineVisualizer />

      {/* 41 vs 78 Network Feature Vector Table (Section #17) */}
      <FeatureTable />
    </div>
  );
};

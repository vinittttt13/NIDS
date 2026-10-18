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
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line-700">
        <div>
          <h1 className="text-xl font-medium text-paper-100">AI intrusion detection engine</h1>
          <p className="text-[13px] text-paper-400 mt-1 max-w-[70ch]">
            Supervised multi-class traffic classification, unsupervised outlier scoring, and explainable feature attribution.
          </p>
        </div>
        <span className="text-[12px] font-mono text-paper-600">XGBoost v1.4 + isolation forest</span>
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

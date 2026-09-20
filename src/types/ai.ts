export type FeatureSchemaType = '41_FEATURES' | '78_FEATURES';

export interface ModelMetricStats {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  averageInferenceTimeMs: number;
  totalInferences: number;
  modelType: string;
  modelVersion: string;
  framework: string;
  datasetTrainedOn: string;
  lastUpdated: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
}

export interface ClassProbability {
  label: string;
  probability: number; // 0.0 - 1.0
  color: string;
  isDominant?: boolean;
}

export interface NetworkFeatureItem {
  id: string;
  name: string;
  category: 'Flow Basic' | 'Inter-Arrival Time' | 'Flag Counts' | 'Packet Statistics' | 'Payload & Window';
  value: number | string;
  unit: string;
  baseline: string;
  importance: number; // 0-100%
  description: string;
  schema: 'BOTH' | '78_ONLY';
}

export interface PipelineStageState {
  id: string;
  order: number;
  title: string;
  description: string;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'WARNING';
  latencyMs: number;
  meta: string;
}

export interface InferenceInspection {
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  predictedClass: string;
  confidence: number;
  anomalyScore: number;
  riskScore: number;
  probabilities: ClassProbability[];
  timestamp: string;
}

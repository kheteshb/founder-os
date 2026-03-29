import axios from 'axios';
import { Analysis, AnalysisSummary, ContextAnswers } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 180000, // 3 min timeout for analysis
});

export interface AnalyzePayload {
  file?: File;
  pastedText?: string;
  context: ContextAnswers;
  groupId?: string;
}

export async function analyzeDocument(payload: AnalyzePayload): Promise<Analysis> {
  const formData = new FormData();

  if (payload.file) {
    formData.append('file', payload.file);
  } else if (payload.pastedText) {
    formData.append('pastedText', payload.pastedText);
  }

  formData.append('objective', payload.context.objective);
  formData.append('stage', payload.context.stage);
  formData.append('raised', payload.context.raised);
  formData.append('targetInvestor', payload.context.targetInvestor);
  formData.append('whyInvestor', payload.context.whyInvestor);
  formData.append('keyMetric', payload.context.keyMetric);
  formData.append('biggestConcern', payload.context.biggestConcern);

  if (payload.groupId) {
    formData.append('groupId', payload.groupId);
  }

  const res = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return res.data.analysis;
}

export async function getAnalysis(id: string): Promise<Analysis> {
  const res = await api.get(`/analyze/${id}`);
  return res.data;
}

export async function getHistory(): Promise<AnalysisSummary[]> {
  const res = await api.get('/history');
  return res.data;
}

export async function getGroupHistory(groupId: string): Promise<Analysis[]> {
  const res = await api.get(`/history/group/${groupId}`);
  return res.data;
}

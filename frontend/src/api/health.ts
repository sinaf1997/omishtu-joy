import { apiClient } from './client.js';
import { ApiResponse } from '../types/api.js';

export interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

export interface ReadinessData {
  status: string;
  database: {
    connected: boolean;
    host: string;
    name: string;
    message?: string;
  };
}

export async function checkHealth(): Promise<HealthData> {
  const response = await apiClient.get<ApiResponse<HealthData>>('/health');
  if (!response.data.data) {
    throw new Error('Invalid health response format');
  }
  return response.data.data;
}

export async function checkReadiness(): Promise<ReadinessData> {
  const response = await apiClient.get<ApiResponse<ReadinessData>>('/health/ready');
  if (!response.data.data) {
    throw new Error('Invalid readiness response format');
  }
  return response.data.data;
}

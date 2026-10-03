import axios from 'axios';
import { HealthCheckResponse, ServiceHealth } from '../types/common';

export const checkServiceHealth = async (port: number): Promise<ServiceHealth> => {
  const startTime = Date.now();
  try {
    const response = await axios.get<HealthCheckResponse>(`http://localhost:${port}/actuator/health`, {
      timeout: 3000,
    });
    const latency = Date.now() - startTime;
    return {
      status: response.data.status === 'UP' ? 'UP' : 'DOWN',
      responseTime: latency,
      lastChecked: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unreachable';
    return {
      status: 'DOWN',
      lastChecked: new Date().toLocaleTimeString(),
      error: errorMsg,
    };
  }
};

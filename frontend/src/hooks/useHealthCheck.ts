import { useState, useCallback } from 'react';
import { ServiceMetadata, ServiceHealth } from '../types/common';
import { checkServiceHealth } from '../services/healthService';

export const useHealthCheck = (services: ServiceMetadata[]) => {
  const [healthMap, setHealthMap] = useState<Record<string, ServiceHealth>>({});
  const [isCheckingAll, setIsCheckingAll] = useState<boolean>(false);

  const pingService = useCallback(async (service: ServiceMetadata) => {
    setHealthMap((prev) => ({
      ...prev,
      [service.id]: { status: 'CHECKING' },
    }));

    const result = await checkServiceHealth(service.port);
    setHealthMap((prev) => ({
      ...prev,
      [service.id]: result,
    }));
  }, []);

  const pingAllServices = useCallback(async () => {
    setIsCheckingAll(true);
    // Mark all as checking
    setHealthMap(
      services.reduce((acc, s) => ({ ...acc, [s.id]: { status: 'CHECKING' } }), {})
    );

    const promises = services.map(async (service) => {
      const result = await checkServiceHealth(service.port);
      return { id: service.id, result };
    });

    const results = await Promise.all(promises);
    const newHealthMap: Record<string, ServiceHealth> = {};
    results.forEach(({ id, result }) => {
      newHealthMap[id] = result;
    });

    setHealthMap(newHealthMap);
    setIsCheckingAll(false);
  }, [services]);

  return {
    healthMap,
    isCheckingAll,
    pingService,
    pingAllServices,
  };
};

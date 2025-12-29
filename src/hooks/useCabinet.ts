import { useState, useEffect } from 'react';

const CABINET_KEY = 'capsula.cabinet';

interface CabinetData {
  ids: string[];
}

function getCabinet(): string[] {
  try {
    const data = localStorage.getItem(CABINET_KEY);
    if (!data) return [];
    const parsed: CabinetData = JSON.parse(data);
    return parsed.ids || [];
  } catch {
    return [];
  }
}

function saveCabinet(ids: string[]): void {
  try {
    const data: CabinetData = { ids };
    localStorage.setItem(CABINET_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cabinet:', error);
  }
}

export function useCabinet() {
  const [cabinetIds, setCabinetIds] = useState<string[]>(getCabinet());

  useEffect(() => {
    const handleStorageChange = () => {
      setCabinetIds(getCabinet());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isInCabinet = (drugId: string): boolean => {
    return cabinetIds.includes(drugId);
  };

  const addToCabinet = (drugId: string): void => {
    if (!cabinetIds.includes(drugId)) {
      const newIds = [...cabinetIds, drugId];
      setCabinetIds(newIds);
      saveCabinet(newIds);
    }
  };

  const removeFromCabinet = (drugId: string): void => {
    const newIds = cabinetIds.filter(id => id !== drugId);
    setCabinetIds(newIds);
    saveCabinet(newIds);
  };

  return {
    cabinetIds,
    isInCabinet,
    addToCabinet,
    removeFromCabinet,
  };
}


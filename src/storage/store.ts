import { create } from 'zustand';
import { loadData, saveData, type StoredData } from './schema';

interface AppStore extends StoredData {
  setRange: (range: StoredData['range']) => void;
}

export const useAppStore = create<AppStore>((set) => {
  const initial = loadData();
  return {
    ...initial,
    setRange: (range) => {
      const updated: StoredData = {
        ...initial,
        range,
      };
      saveData(updated);
      set(updated);
    },
  };
});

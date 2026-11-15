import { create } from 'zustand';
import { loadData, saveData, type StoredData } from './schema';

interface AppStore extends StoredData {
  setRange: (range: StoredData['range']) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...loadData(),
  setRange: (range) => {
    const { version, settings, progress, importedLessons } = get();
    const updated: StoredData = { version, settings, progress, importedLessons, range };
    saveData(updated);
    set(updated);
  },
}));

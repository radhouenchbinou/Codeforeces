import { create } from 'zustand';

interface ProfileCard {
  queueItemId: string;
  userId: string;
  displayName: string;
  age: number;
  gender: string;
  datingIntent: string;
  bio: string;
  locationCity: string;
  voiceIntroUrl: string | null;
  voiceIntroDuration: number | null;
}

interface DiscoveryState {
  deck: ProfileCard[];
  currentIndex: number;
  isLoading: boolean;
  lastFetchDate: string | null;

  setDeck: (deck: ProfileCard[]) => void;
  advance: () => void;
  reset: () => void;
  setLoading: (val: boolean) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  deck: [],
  currentIndex: 0,
  isLoading: false,
  lastFetchDate: null,

  setDeck: (deck) =>
    set({ deck, currentIndex: 0, lastFetchDate: new Date().toISOString().split('T')[0] }),

  advance: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1 })),

  reset: () => set({ deck: [], currentIndex: 0, lastFetchDate: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));

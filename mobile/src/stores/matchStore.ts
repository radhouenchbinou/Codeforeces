import { create } from 'zustand';

interface Partner {
  id: string;
  displayName: string;
  age: number;
  voiceIntroUrl?: string;
}

interface Match {
  id: string;
  partner: Partner;
  streamChannelId: string;
  messageCount: number;
  voiceCallsUnlocked: boolean;
  photosRevealed: boolean;
  myRevealConsent: boolean;
  partnerRevealConsent: boolean;
  createdAt: string;
}

interface MatchState {
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;
  removeMatch: (id: string) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],

  setMatches: (matches) => set({ matches }),

  updateMatch: (id, updates) =>
    set((state) => ({
      matches: state.matches.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  removeMatch: (id) =>
    set((state) => ({ matches: state.matches.filter((m) => m.id !== id) })),
}));

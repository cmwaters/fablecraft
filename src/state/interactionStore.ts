import { create } from "zustand";

interface InteractionState {
  activeCardId: string | null;
  setActiveCardId: (cardId: string | null) => void;
}

export const useInteractionStore = create<InteractionState>((set) => ({
  activeCardId: null,
  setActiveCardId: (cardId) => set({ activeCardId: cardId }),
}));

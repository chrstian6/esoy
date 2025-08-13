import { create } from "zustand";

// Define Photo interface for future use

export const useStore =
  create <
  ModalState >
  ((set) => ({
    isOpen: false,
    selectedPhoto: null,
    openModal: (photo) => set({ isOpen: true, selectedPhoto: photo }),
    closeModal: () => set({ isOpen: false, selectedPhoto: null }),
  }));

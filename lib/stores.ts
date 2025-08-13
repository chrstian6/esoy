// lib/stores.ts
"use client";

import { create } from "zustand";

interface ModalStore {
  // Existing modal states
  isLoginModalOpen: boolean;
  isOtpModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isProfileEditOpen: boolean;
  isAuthenticated: boolean;
  isUploadPhotosOpen: boolean;
  isNewsletterModalOpen: boolean;
  isCategoryManagementOpen: boolean;
  isPromoCodeManagementOpen: boolean;

  // Existing modal actions
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openOtpModal: () => void;
  closeOtpModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openProfileEdit: () => void;
  closeProfileEdit: () => void;
  setAuthenticated: (value: boolean) => void;
  openUploadPhotos: () => void;
  closeUploadPhotos: () => void;
  openNewsletterModal: () => void;
  closeNewsletterModal: () => void;
  openCategoryManagement: () => void;
  closeCategoryManagement: () => void;

  // New promo code management actions
  openPromoCodeManagement: () => void;
  closePromoCodeManagement: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  // Existing states
  isLoginModalOpen: false,
  isOtpModalOpen: false,
  isSettingsModalOpen: false,
  isProfileEditOpen: false,
  isAuthenticated: false,
  isUploadPhotosOpen: false,
  isCategoryManagementOpen: false,
  isNewsletterModalOpen: false,
  isPromoCodeManagementOpen: false,

  // Existing actions
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  openOtpModal: () => set({ isOtpModalOpen: true }),
  closeOtpModal: () => set({ isOtpModalOpen: false }),
  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),
  openProfileEdit: () => set({ isProfileEditOpen: true }),
  closeProfileEdit: () => set({ isProfileEditOpen: false }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  openUploadPhotos: () => set({ isUploadPhotosOpen: true }),
  closeUploadPhotos: () => set({ isUploadPhotosOpen: false }),
  openCategoryManagement: () => set({ isCategoryManagementOpen: true }),
  closeCategoryManagement: () => set({ isCategoryManagementOpen: false }),
  openNewsletterModal: () => set({ isNewsletterModalOpen: true }),
  closeNewsletterModal: () => set({ isNewsletterModalOpen: false }),

  // New actions
  openPromoCodeManagement: () => set({ isPromoCodeManagementOpen: true }),
  closePromoCodeManagement: () => set({ isPromoCodeManagementOpen: false }),
}));

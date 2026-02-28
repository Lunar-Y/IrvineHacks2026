import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileState {
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => void;
    resetOnboarding: () => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),
            resetOnboarding: () => set({ hasCompletedOnboarding: false }),
        }),
        {
            name: 'profile-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

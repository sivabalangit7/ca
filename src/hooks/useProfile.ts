import { useState, useCallback } from 'react';
import { UserProfile } from '../types/profile';
import { profileService } from '../services/profileService';

export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(() => profileService.getProfile());

  const updateProfile = useCallback((updated: UserProfile) => {
    profileService.saveProfile(updated);
    setProfileState(updated);
  }, []);

  const refreshProfile = useCallback(() => {
    setProfileState(profileService.getProfile());
  }, []);

  return { profile, updateProfile, refreshProfile };
}

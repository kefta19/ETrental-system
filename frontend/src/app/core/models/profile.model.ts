export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
  roles: string[];
  subscriptionTier: string;
  createdAtUtc?: string | null;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  profilePictureUrl?: string | null;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

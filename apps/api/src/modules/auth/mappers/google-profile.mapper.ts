export interface GoogleRawProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
}

export interface NormalizedGoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export class GoogleProfileMapper {
  static map(rawProfile: GoogleRawProfile): NormalizedGoogleProfile {
    const primaryEmail =
      rawProfile.emails && rawProfile.emails.length > 0
        ? rawProfile.emails[0].value
        : '';
    const avatarUrl =
      rawProfile.photos && rawProfile.photos.length > 0
        ? rawProfile.photos[0].value
        : undefined;

    return {
      googleId: rawProfile.id,
      email: primaryEmail.trim().toLowerCase(),
      fullName: rawProfile.displayName || 'Google User',
      avatarUrl,
    };
  }
}

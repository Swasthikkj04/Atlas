export interface GitHubRawProfile {
  id: string;
  username?: string;
  displayName?: string;
  emails?: Array<{ value: string; verified?: boolean; primary?: boolean }>;
  photos?: Array<{ value: string }>;
  _json?: {
    avatar_url?: string;
    email?: string;
  };
}

export interface NormalizedGitHubProfile {
  githubId: string;
  email?: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl?: string;
}

export class GitHubProfileMapper {
  static map(rawProfile: GitHubRawProfile): NormalizedGitHubProfile {
    let selectedEmail: string | undefined;
    let isVerified = false;

    if (rawProfile.emails && rawProfile.emails.length > 0) {
      // Find verified primary email or first verified email
      const verifiedEmail =
        rawProfile.emails.find((e) => e.verified && e.primary) ||
        rawProfile.emails.find((e) => e.verified) ||
        rawProfile.emails[0];

      if (verifiedEmail) {
        selectedEmail = verifiedEmail.value;
        isVerified = Boolean(verifiedEmail.verified);
      }
    } else if (rawProfile._json?.email) {
      selectedEmail = rawProfile._json.email;
      isVerified = true;
    }

    const avatarUrl =
      rawProfile.photos && rawProfile.photos.length > 0
        ? rawProfile.photos[0].value
        : rawProfile._json?.avatar_url;

    const fullName =
      rawProfile.displayName || rawProfile.username || 'GitHub User';

    return {
      githubId: String(rawProfile.id),
      email: selectedEmail ? selectedEmail.trim().toLowerCase() : undefined,
      emailVerified: isVerified,
      fullName,
      avatarUrl,
    };
  }
}

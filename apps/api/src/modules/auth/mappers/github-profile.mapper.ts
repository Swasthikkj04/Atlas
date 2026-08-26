export interface GitHubRawProfile {
  id: string;
  username?: string;
  displayName?: string;
  emails?: Array<{
    value: string;
    verified?: boolean;
    primary?: boolean;
    visibility?: string;
  }>;
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
      // 1. Verified non-noreply primary email
      const verifiedPrimaryReal = rawProfile.emails.find(
        (e) =>
          Boolean(e.verified) &&
          Boolean(e.primary) &&
          !e.value.toLowerCase().includes('noreply.github.com'),
      );

      // 2. Any verified non-noreply email
      const verifiedReal = rawProfile.emails.find(
        (e) =>
          Boolean(e.verified) &&
          !e.value.toLowerCase().includes('noreply.github.com'),
      );

      // 3. Verified primary email (including noreply if that's all available)
      const verifiedPrimary = rawProfile.emails.find(
        (e) => Boolean(e.verified) && Boolean(e.primary),
      );

      // 4. Any verified email
      const anyVerified = rawProfile.emails.find((e) => Boolean(e.verified));

      const chosen =
        verifiedPrimaryReal || verifiedReal || verifiedPrimary || anyVerified;

      if (chosen) {
        selectedEmail = chosen.value;
        isVerified = true;
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

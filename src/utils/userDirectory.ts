import { Creator } from '../types';
import { getRegisteredIdentities } from './deviceFingerprint';

const KNOWN_USERS_STORAGE_KEY = 'valuvid_all_known_users';

/**
 * Universal clean profile picture resolver.
 * Ensures no user ever displays the company app logo or broken mock image paths.
 */
export function getUserAvatar(avatar?: string, _nameOrUsername?: string): string {
  if (
    avatar &&
    avatar !== '/default-avatar.jpg' &&
    !avatar.includes('/default-avatar.jpg') &&
    !avatar.includes('unsplash.com') &&
    !avatar.includes('bottts') &&
    !avatar.includes('dicebear.com') &&
    (avatar.startsWith('data:image') || avatar.startsWith('http://') || avatar.startsWith('https://') || avatar === '/default-avatar.svg')
  ) {
    return avatar;
  }
  return '/default-avatar.svg';
}

/**
 * No mock community creators - only real registered accounts appear
 */
export const COMMUNITY_CREATORS: Creator[] = [];

const isMockAccount = (uname?: string) => {
  if (!uname) return true;
  const u = uname.toLowerCase().replace(/^@/, '');
  return (
    u === 'emmanuel_creator' ||
    u === 'kwame_code' ||
    u === 'user_current' ||
    u === 'user_fintech' ||
    u === 'demo-creator-1' ||
    u === 'deleted' ||
    u.startsWith('test')
  );
};

/**
 * Get all known creators and users across the app (STRICTLY REAL REGISTERED USERS)
 */
export function getAllKnownUsers(): Creator[] {
  const map = new Map<string, Creator>();

  // 1. Load all genuine accounts registered on this device
  try {
    const identities = getRegisteredIdentities();
    identities.forEach((id) => {
      const u = id.username.toLowerCase();
      if (!isMockAccount(u) && !map.has(u)) {
        map.set(u, {
          id: id.id,
          name: id.username.charAt(0).toUpperCase() + id.username.slice(1),
          username: id.username,
          email: id.email,
          avatar: getUserAvatar(undefined, id.username),
          bio: 'ValuVid Creator 🇬🇭',
          followers: 0,
          following: 0,
          likes: 0,
          totalTipsEarned: 0,
          verified: false,
          isFollowing: false,
        });
      }
    });
  } catch {}

  // 2. Load stored registered users from localStorage (sanitizing any legacy mock data)
  try {
    const raw = localStorage.getItem(KNOWN_USERS_STORAGE_KEY);
    if (raw) {
      const list: Creator[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((u) => {
          if (u.username && !isMockAccount(u.username)) {
            const cleanUsername = u.username.toLowerCase();
            const existing = map.get(cleanUsername) || {};
            const cleanFollowers = typeof u.followers === 'number' ? Math.max(0, u.followers) : 0;
            const cleanFollowing = typeof u.following === 'number' ? Math.max(0, u.following) : 0;
            const cleanAvatar = getUserAvatar(u.avatar, u.username);
            map.set(cleanUsername, {
              ...existing,
              ...u,
              followers: cleanFollowers,
              following: cleanFollowing,
              avatar: cleanAvatar,
            });
          }
        });
      }
    }
  } catch {}

  return Array.from(map.values());
}

/**
 * Persist a user profile into the known users registry
 */
export function recordKnownUser(creator: Partial<Creator> & { username: string }): void {
  try {
    const cleanUsername = creator.username.trim().toLowerCase().replace(/^@/, '');
    const currentList = getAllKnownUsers();
    const existingIndex = currentList.findIndex((u) => u.username.toLowerCase() === cleanUsername);

    const updatedUser: Creator = {
      id: creator.id || `user_${Date.now()}`,
      name: creator.name || cleanUsername,
      email: creator.email || '',
      avatar: creator.avatar || '/default-avatar.jpg',
      bio: creator.bio || 'ValuVid Creator 🇬🇭',
      followers: creator.followers ?? 0,
      following: creator.following ?? 0,
      likes: creator.likes ?? 0,
      totalTipsEarned: creator.totalTipsEarned ?? 0,
      verified: creator.verified ?? false,
      isFollowing: creator.isFollowing ?? false,
      ...creator,
      username: cleanUsername,
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = { ...currentList[existingIndex], ...updatedUser };
    } else {
      currentList.unshift(updatedUser);
    }

    localStorage.setItem(KNOWN_USERS_STORAGE_KEY, JSON.stringify(currentList));
  } catch {}
}

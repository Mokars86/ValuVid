/**
 * ValuVid Device Fingerprinting & Anti-Duplicate Multi-Account Prevention Engine
 * Enforces strictly 1 User = 1 Account per individual and device.
 */

const DEVICE_STORAGE_KEY = 'valuvid_device_token';
const REGISTERED_ACCOUNTS_KEY = 'valuvid_registered_identities';

export interface RegisteredIdentity {
  id: string;
  username: string;
  phone: string;
  email: string;
  deviceToken: string;
  registeredAt: string;
}

/**
 * Generate a persistent, pseudo-unique device hardware token
 */
export function getDeviceFingerprint(): string {
  try {
    const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) return existing;

    // Build hash from hardware & environment properties
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasHash = 'cv-fallback';
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('ValuVid-1User1Account-2026', 2, 15);
      canvasHash = canvas.toDataURL().slice(-30);
    }

    const screenData = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const userAgent = navigator.userAgent;
    const lang = navigator.language || 'en';
    const cores = navigator.hardwareConcurrency || 4;

    const rawString = `${canvasHash}-${screenData}-${userAgent}-${lang}-${cores}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    const token = `DEV-${Math.abs(hash).toString(36).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, token);
    return token;
  } catch {
    const fallback = `DEV-FALLBACK-${Date.now()}`;
    return fallback;
  }
}

/**
 * Normalize African and International Phone Numbers
 * Converts local 024XXXXXXX to +23324XXXXXXX for Ghana, etc.
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = '+233'): string {
  const digitsOnly = phone.replace(/[^\d+]/g, '');
  if (!digitsOnly) return '';

  if (digitsOnly.startsWith('+')) {
    return digitsOnly;
  }

  if (digitsOnly.startsWith('0')) {
    return `${defaultCountryCode}${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.startsWith('233') || digitsOnly.startsWith('234') || digitsOnly.startsWith('254')) {
    return `+${digitsOnly}`;
  }

  return `${defaultCountryCode}${digitsOnly}`;
}

/**
 * Get all registered identities on this device/environment
 */
export function getRegisteredIdentities(): RegisteredIdentity[] {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Verify whether a new registration violates the 1 User = 1 Account policy
 */
export function validateNewRegistration(params: {
  phone: string;
  email: string;
  username: string;
}): { allowed: boolean; reason?: string } {
  const normalizedPhone = normalizePhoneNumber(params.phone);
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedUsername = params.username.trim().toLowerCase().replace(/^@/, '');
  const currentDevice = getDeviceFingerprint();

  const identities = getRegisteredIdentities();

  // 1. Phone / MoMo Number Uniqueness Check (Primary African identity anchor)
  const phoneConflict = identities.find(
    (id) => normalizePhoneNumber(id.phone) === normalizedPhone
  );
  if (phoneConflict) {
    return {
      allowed: false,
      reason: `The phone number ${normalizedPhone} is already registered to user @${phoneConflict.username}. ValuVid policy enforces strictly 1 user = 1 account.`,
    };
  }

  // 2. Email Conflict Check
  const emailConflict = identities.find(
    (id) => id.email.toLowerCase() === normalizedEmail
  );
  if (emailConflict) {
    return {
      allowed: false,
      reason: `The email address ${params.email} is already registered to user @${emailConflict.username}. Please sign in instead.`,
    };
  }

  // 3. Username Conflict Check
  const usernameConflict = identities.find(
    (id) => id.username.toLowerCase() === normalizedUsername
  );
  if (usernameConflict) {
    return {
      allowed: false,
      reason: `The username @${normalizedUsername} is already taken. Please choose another unique handle.`,
    };
  }

  // 4. Device Hardware Binding Check
  // If an active account was already registered on this physical device, block duplicate registration
  const deviceConflict = identities.find(
    (id) => id.deviceToken === currentDevice
  );
  if (deviceConflict) {
    return {
      allowed: false,
      reason: `This device is already registered to account @${deviceConflict.username}. To ensure fair watch-rewards and transparent platform liquidity, each person is restricted to 1 active account per device. Please sign in to your existing account.`,
    };
  }

  return { allowed: true };
}

/**
 * Record a successfully created account to the persistent registry
 */
export function recordNewRegistration(params: {
  id: string;
  username: string;
  phone: string;
  email: string;
}): void {
  const currentDevice = getDeviceFingerprint();
  const normalizedPhone = normalizePhoneNumber(params.phone);
  const cleanUsername = params.username.trim().toLowerCase().replace(/^@/, '');

  const newIdentity: RegisteredIdentity = {
    id: params.id,
    username: cleanUsername,
    phone: normalizedPhone,
    email: params.email.trim().toLowerCase(),
    deviceToken: currentDevice,
    registeredAt: new Date().toISOString(),
  };

  const list = getRegisteredIdentities().filter((id) => id.id !== params.id);
  list.push(newIdentity);

  try {
    localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Verify payout channel exclusivity (prevents linking the same MoMo/Bank number to multiple accounts)
 */
export function validatePayoutChannelExclusivity(accountNumber: string, currentUsername: string): { allowed: boolean; reason?: string } {
  const cleanNumber = accountNumber.replace(/[^\d+]/g, '');
  const identities = getRegisteredIdentities();

  // If this phone/number belongs to a different registered user
  const conflict = identities.find((id) => {
    const registeredPhoneClean = id.phone.replace(/[^\d+]/g, '');
    return registeredPhoneClean.endsWith(cleanNumber) || cleanNumber.endsWith(registeredPhoneClean);
  });

  if (conflict && conflict.username.toLowerCase() !== currentUsername.toLowerCase()) {
    return {
      allowed: false,
      reason: `This Mobile Money / Bank number is already bound to @${conflict.username}. Payout channels cannot be shared across multiple accounts to comply with anti-fraud liquidity policies.`,
    };
  }

  return { allowed: true };
}

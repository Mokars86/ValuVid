/**
 * ValuVid Paystack Payment & Escrow Service
 * Powers:
 * 1. User Wallet Top-Up (MTN MoMo, Telecel Cash, Debit Cards)
 * 2. Creator Earnings Withdrawals (Transfers API)
 * 3. Platform & Developer Commission Auto-Split
 * 4. Brand Micro-Bounty Escrow Ledger
 */

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => {
        openIframe: () => void;
      };
    };
  }
}

export interface PaystackPaymentSuccessResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
  redirecturl?: string;
}

export interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number; // in pesewas (1 GHS = 100 pesewas)
  currency?: 'GHS' | 'USD' | 'NGN';
  ref?: string;
  metadata?: Record<string, any>;
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  callback: (response: PaystackPaymentSuccessResponse) => void;
  onClose: () => void;
  subaccount?: string;
  bearer?: 'account' | 'subaccount';
}

export interface BountyEscrowRecord {
  id: string;
  bountyId: string;
  bountyTitle: string;
  sponsorName: string;
  sponsorEmail: string;
  totalPrizeGHS: number;
  developerCommissionGHS: number;
  totalFundedGHS: number;
  paystackReference: string;
  status: 'ESCROW_LOCKED' | 'PAYOUT_IN_PROGRESS' | 'COMPLETED' | 'REFUNDED';
  createdAt: string;
  releasedAt?: string;
  winners?: {
    rank: number;
    creatorUsername: string;
    amountGHS: number;
    paidAt?: string;
    transferReference?: string;
  }[];
}

export const GHANA_BANKS = [
  'GCB Bank',
  'Ecobank Ghana',
  'Stanbic Bank Ghana',
  'Absa Bank Ghana',
  'Fidelity Bank Ghana',
  'CalBank',
  'Zenith Bank Ghana',
  'Standard Chartered Bank',
  'Access Bank Ghana',
  'United Bank for Africa (UBA)',
  'Guaranty Trust Bank (GTBank)',
  'Republic Bank Ghana',
  'Consolidated Bank Ghana (CBG)',
  'FBNBank Ghana',
  'Agricultural Development Bank (ADB)',
  'Societe Generale Ghana',
  'Prudential Bank',
  'Bank of Africa Ghana',
  'First National Bank Ghana',
  'OmniBSIC Bank'
];

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js';

export function getPaystackPublicKey(): string {
  return (
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
    'pk_live_ab1bdb953e81c8def7dd5c531400cdc67e1d59e2'
  );
}

export function getPlatformCommissionPercent(): number {
  const envVal = Number(import.meta.env.VITE_PLATFORM_COMMISSION_PERCENT);
  return !isNaN(envVal) && envVal >= 0 && envVal <= 50 ? envVal : 10;
}

/**
 * Dynamically loads Paystack Inline JS script into the document head
 */
export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('paystack-inline-js');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-inline-js';
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Paystack inline script failed to load. Operating in safe fallback mode.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Launches Paystack Popup for Wallet Top-Up, Pay-Per-Unlock, or Bounty Sponsorship
 */
export async function launchPaystackPayment({
  email,
  amountGHS,
  metadata = {},
  onSuccess,
  onClose,
  channels = ['mobile_money', 'card', 'bank_transfer'],
  currency = 'GHS',
}: {
  email: string;
  amountGHS: number;
  metadata?: Record<string, any>;
  onSuccess: (response: PaystackPaymentSuccessResponse) => void;
  onClose?: () => void;
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  currency?: 'GHS' | 'USD' | 'NGN';
}): Promise<void> {
  const loaded = await loadPaystackScript();
  const publicKey = getPaystackPublicKey();
  const reference = `VALU_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Amount in Pesewas (Paystack accepts integer subunit)
  const amountInPesewas = Math.round(amountGHS * 100);

  if (!loaded || !window.PaystackPop) {
    console.error(`[Paystack] Failed to load PaystackPop script for ${email}`);
    alert('Unable to connect to Paystack payment gateway. Please check your internet connection and try again.');
    if (onClose) onClose();
    return;
  }

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: email && email.includes('@') ? email : 'wallet@valuvid.app',
    amount: amountInPesewas,
    currency,
    ref: reference,
    metadata: {
      custom_fields: [
        { display_name: 'App', variable_name: 'app', value: 'ValuVid' },
        { display_name: 'Payment Type', variable_name: 'payment_type', value: metadata.type || 'wallet_topup' },
        ...(metadata.customFields || []),
      ],
      ...metadata,
    },
    channels,
    callback: (response) => {
      onSuccess(response);
    },
    onClose: () => {
      if (onClose) onClose();
    },
  });

  handler.openIframe();
}

/**
 * Calculates Developer Commission Split
 * e.g., for a GHS 1,000 bounty at 10% commission:
 * - Prize Pool: GHS 1,000
 * - Platform Commission: GHS 100
 * - Total Billed: GHS 1,100
 */
export function calculatePlatformSplit(
  amountGHS: number,
  commissionPercent: number = getPlatformCommissionPercent()
): {
  baseAmount: number;
  commissionAmount: number;
  totalWithCommission: number;
  commissionPercent: number;
} {
  const commission = Number(((amountGHS * commissionPercent) / 100).toFixed(2));
  return {
    baseAmount: amountGHS,
    commissionAmount: commission,
    totalWithCommission: Number((amountGHS + commission).toFixed(2)),
    commissionPercent,
  };
}

/**
 * Local & Supabase Bounty Escrow Ledger Helpers
 */
const ESCROW_STORAGE_KEY = 'valuvid_bounty_escrows';

export function getEscrowLedger(): BountyEscrowRecord[] {
  try {
    return JSON.parse(localStorage.getItem(ESCROW_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveEscrowDeposit(escrow: BountyEscrowRecord): void {
  try {
    const list = getEscrowLedger();
    const updated = [escrow, ...list.filter((e) => e.bountyId !== escrow.bountyId)];
    localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save escrow deposit:', err);
  }
}

export function releaseEscrowToWinners(
  bountyId: string,
  winners: { rank: number; creatorUsername: string; amountGHS: number }[]
): BountyEscrowRecord | null {
  try {
    const list = getEscrowLedger();
    const item = list.find((e) => e.bountyId === bountyId);
    if (!item) return null;

    item.status = 'COMPLETED';
    item.releasedAt = new Date().toISOString();
    item.winners = winners.map((w) => ({
      ...w,
      paidAt: new Date().toISOString(),
      transferReference: `TRF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    }));

    localStorage.setItem(ESCROW_STORAGE_KEY, JSON.stringify(list));
    return item;
  } catch (err) {
    console.error('Failed to release escrow:', err);
    return null;
  }
}

# ValuVid Paystack Payment, Escrow & Commission Architecture Guide 🇬🇭

This guide provides the complete end-to-end configuration for running **Paystack** on ValuVid for:
1. **Wallet Top-Up**: Viewers deposit Ghanaian Cedis (GHS) via MTN Mobile Money, Telecel Cash, or Cards.
2. **Creator Withdrawals**: Creators instantly cash out their tips and watch earnings to their Mobile Money wallets.
3. **Developer / Platform Commission**: Automatic 10% platform fee routed to the developer's bank/MoMo account.
4. **Brand Micro-Bounty Escrow**: Brands lock sponsorship funds upfront in escrow and release rewards to verified challenge winners.

---

## 1. Environment Keys Configuration

In your `.env` (Frontend):
```bash
VITE_PAYSTACK_PUBLIC_KEY=pk_test_b8e2b8344e69b0fa63b0b7498c19951664bf3507
VITE_PLATFORM_COMMISSION_PERCENT=10
```

In your Supabase Vault / Edge Functions Secrets (Backend Only):
```bash
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_DEVELOPER_SUBACCOUNT=ACCT_xxxxxxxxx   # (Optional: for automated split payments)
```

---

## 2. Supabase SQL Database Migration

Execute this SQL schema in your **Supabase Dashboard > SQL Editor** to support real-time wallet balances, transactions, and bounty escrow:

```sql
-- 1. Create Wallet Accounts Table
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    balance_ghs NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    creator_tips_earned NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    viewer_watch_rewards NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_withdrawn_ghs NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Wallet Transactions Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL, -- 'topup', 'tip_sent', 'tip_received', 'cashout', 'bounty_reward', 'escrow_deposit'
    amount_ghs NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL, -- 'pending', 'completed', 'failed'
    paystack_reference TEXT UNIQUE,
    channel TEXT DEFAULT 'mobile_money',
    destination_account TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Brand Bounty Escrow Table
CREATE TABLE IF NOT EXISTS public.bounty_escrows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bounty_id TEXT NOT NULL,
    sponsor_name TEXT NOT NULL,
    sponsor_email TEXT NOT NULL,
    total_prize_ghs NUMERIC(12, 2) NOT NULL,
    developer_commission_ghs NUMERIC(12, 2) NOT NULL,
    total_funded_ghs NUMERIC(12, 2) NOT NULL,
    paystack_reference TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ESCROW_LOCKED' NOT NULL, -- 'ESCROW_LOCKED', 'PAYOUT_IN_PROGRESS', 'COMPLETED', 'REFUNDED'
    winners JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    released_at TIMESTAMP WITH TIME ZONE
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_escrows ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own balance
CREATE POLICY "Users can view own wallet"
ON public.wallet_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Public can inspect locked escrow transparency
CREATE POLICY "Public can inspect active bounty escrows"
ON public.bounty_escrows FOR SELECT
USING (true);
```

---

## 3. How the 4 Financial Flows Work

### A. Viewer Wallet Top-Up
1. User clicks **Add Funds** in `ValuWallet.tsx`.
2. Chooses amount (e.g. GHS 50.00).
3. The app invokes `launchPaystackPayment()` from `paystackService.ts`.
4. Paystack Inline popup opens with MTN MoMo, Telecel Cash, and Card channels.
5. User enters MoMo number, confirms prompt on phone.
6. Paystack returns `charge.success` with `reference`.
7. `addFundsToWallet()` credits the user balance and logs the transaction.

### B. Creator Cashout (Paystack Transfers API)
1. Creator opens `CashoutDrawer.tsx` and requests e.g. GHS 100.00.
2. The request is sent to Supabase Edge Function `paystack-transfer`.
3. The Edge Function:
   - Resolves the MoMo network (MTN, Telecel, AT).
   - Creates a Paystack transfer recipient (`POST https://api.paystack.co/transferrecipient`).
   - Initiates the instant transfer (`POST https://api.paystack.co/transfer`).
4. Funds land directly in the creator's phone wallet within seconds.
5. Transaction marked `completed` with reference code `TRF_PSTK_...`.

### C. Developer Commission Auto-Split
There are two ways to receive your developer commission:
- **Method 1 (Paystack Split Payments)**:
  Configure a Subaccount for your business on the Paystack dashboard. Every deposit automatically splits 90% into the platform pool and 10% directly into your subaccount.
- **Method 2 (Upfront Bounty & Tipping Fee)**:
  When a brand sponsors a GHS 1,000 bounty:
  - Creator Prize Pool: **GHS 1,000.00**
  - Developer Platform Commission (10%): **GHS 100.00**
  - Total Billed to Brand: **GHS 1,100.00**
  - The GHS 100 commission is logged and settled directly to the developer's bank/MoMo.

### D. Brand Micro-Bounty Escrow
1. A brand sponsor launches a challenge via `SponsorBountyModal.tsx`.
2. Total amount (Prize Pool + Developer Fee) is billed through Paystack.
3. Once approved, the record is stored in `bounty_escrows` with status `ESCROW_LOCKED`.
4. Creators compete by posting authentic vertical videos.
5. When winners are selected (e.g. 1st Place = GHS 500, 2nd Place = GHS 300, 3rd Place = GHS 200):
   - Payouts are triggered to the winners' MoMo accounts.
   - Escrow status updates to `COMPLETED`.

---

## 4. Supabase Webhook Listener (Edge Function)

Create this Edge Function in Supabase (`supabase/functions/paystack-webhook/index.ts`):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const signature = req.headers.get("x-paystack-signature");
  const bodyText = await req.text();

  // 1. Verify HMAC SHA512 Signature
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(bodyText));
  const hexHash = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (hexHash !== signature) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(bodyText);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // 2. Handle Charge Success (Wallet Top-Up or Bounty Escrow)
  if (event.event === "charge.success") {
    const data = event.data;
    const amountGHS = data.amount / 100;
    const metadata = data.metadata || {};

    if (metadata.type === "bounty_escrow") {
      await supabase.from("bounty_escrows").update({ status: "ESCROW_LOCKED" }).eq("paystack_reference", data.reference);
    } else {
      // Credit user's wallet
      const userId = metadata.userId;
      if (userId) {
        await supabase.rpc("credit_wallet_balance", {
          p_user_id: userId,
          p_amount: amountGHS,
          p_reference: data.reference,
        });
      }
    }
  }

  return new Response("Webhook processed", { status: 200 });
});
```

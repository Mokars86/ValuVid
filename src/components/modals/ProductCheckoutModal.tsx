import React, { useState } from 'react';
import { X, ShoppingBag, ShieldCheck, CheckCircle2, Truck, Smartphone, Wallet, ArrowRight, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductItem } from '../../types';

interface ProductCheckoutModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { wallet, theme, buyProduct, currentUser } = useApp();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(
    currentUser?.phone || (typeof localStorage !== 'undefined' ? localStorage.getItem('valuvid_user_payout_phone') || '' : '')
  );
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'momo'>('wallet');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'Telecel' | 'AT'>('MTN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !product) return null;

  const platformFee = Number((product.priceGHS * 0.04).toFixed(2));
  const sellerEarnings = Number((product.priceGHS - platformFee).toFixed(2));
  const hasSufficientWalletBalance = wallet.balanceGHS >= product.priceGHS;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (product.type === 'physical' && !deliveryAddress.trim()) {
      setErrorMessage('Please enter your delivery location or address.');
      return;
    }

    if (!contactPhone.trim() || contactPhone.length < 9) {
      setErrorMessage('Please enter a valid Ghana phone number (e.g. 024XXXXXXX).');
      return;
    }

    if (paymentMethod === 'wallet' && !hasSufficientWalletBalance) {
      setErrorMessage(`Insufficient ValuWallet balance (GHS ${wallet.balanceGHS.toFixed(2)}). Please select Direct Mobile Money.`);
      return;
    }

    setIsProcessing(true);

    try {
      // Complete purchase via AppContext
      await buyProduct({
        productId: product.id,
        productTitle: product.title,
        sellerUsername: product.creatorUsername,
        amountGHS: product.priceGHS,
        platformFeeGHS: platformFee,
        deliveryAddress: deliveryAddress.trim() || 'Digital Delivery',
        contactPhone: contactPhone.trim(),
        paymentMethod: paymentMethod === 'wallet' ? 'In-App Wallet' : `${momoProvider} MoMo`,
      });

      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Payment processing failed. Please try again.');
    }
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-md md:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border transition-all ${
          isLight ? 'bg-white text-neutral-900 border-neutral-200' : 'bg-neutral-950 text-white border-neutral-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/30">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-1.5">
                ValuShop Checkout
              </h2>
              <p className="text-[11px] text-neutral-400">Escrow-Protected Local Commerce</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isLight ? 'hover:bg-neutral-100 text-neutral-500' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-10 text-center flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black mb-1">Order Placed Successfully!</h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-4">
              GHS {product.priceGHS.toFixed(2)} has been secured in <span className="text-amber-400 font-bold">ValuWallet Escrow</span>.
            </p>
            <div className={`p-3 rounded-2xl text-xs max-w-xs border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              🔒 Funds will be safely released to @{product.creatorUsername} once you confirm delivery in your ValuWallet!
            </div>
          </div>
        ) : (
          <form onSubmit={handlePurchase} className="mt-4 space-y-4">
            {/* Product Card Card */}
            <div className={`flex gap-3.5 p-3 rounded-2xl border ${
              isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/70 border-neutral-800'
            }`}>
              <img
                src={product.imageUrl || '/default-avatar.jpg'}
                alt={product.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                }}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-neutral-700/50"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {product.type === 'physical' ? 'Physical Item' : 'Digital Product'}
                  </span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    GHS {product.priceGHS.toFixed(2)}
                  </span>
                </div>
                <h4 className="text-sm font-bold truncate mt-1">{product.title}</h4>
                <p className="text-[11px] text-neutral-400">Sold by @{product.creatorUsername}</p>
              </div>
            </div>

            {/* Delivery Info Badge */}
            {product.deliveryInfo && (
              <div className={`flex items-start gap-2 p-2.5 rounded-xl text-xs border ${
                isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-sky-950/30 border-sky-500/20 text-sky-300'
              }`}>
                <Truck className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
                <span className="leading-snug">{product.deliveryInfo}</span>
              </div>
            )}

            {/* Delivery Location / Address Input (for physical items) */}
            {product.type === 'physical' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 text-neutral-400">
                  Delivery Address / Location (Ghana) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. House #14, Osu Oxford Street, Accra (Near Total Station)"
                  className={`w-full p-2.5 rounded-xl text-xs outline-none border transition-all ${
                    isLight 
                      ? 'bg-neutral-50 border-neutral-300 focus:border-amber-500 text-neutral-900' 
                      : 'bg-neutral-900 border-neutral-800 focus:border-amber-400 text-white'
                  }`}
                />
              </div>
            )}

            {/* Buyer Contact Phone */}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-neutral-400">
                Contact Phone / MoMo Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="024XXXXXXX"
                className={`w-full p-2.5 rounded-xl text-xs outline-none border transition-all ${
                  isLight 
                    ? 'bg-neutral-50 border-neutral-300 focus:border-amber-500 text-neutral-900' 
                    : 'bg-neutral-900 border-neutral-800 focus:border-amber-400 text-white'
                }`}
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold mb-2 text-neutral-400">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-amber-400 bg-amber-500/10 font-bold'
                      : isLight ? 'border-neutral-200 bg-neutral-50 text-neutral-500' : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <Wallet className={`w-4 h-4 ${paymentMethod === 'wallet' ? 'text-amber-400' : ''}`} />
                  <span className="text-xs">ValuWallet</span>
                  <span className={`text-[10px] font-mono ${hasSufficientWalletBalance ? 'text-emerald-400' : 'text-rose-400'}`}>
                    GHS {wallet.balanceGHS.toFixed(2)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                    paymentMethod === 'momo'
                      ? 'border-amber-400 bg-amber-500/10 font-bold'
                      : isLight ? 'border-neutral-200 bg-neutral-50 text-neutral-500' : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <Smartphone className={`w-4 h-4 ${paymentMethod === 'momo' ? 'text-amber-400' : ''}`} />
                  <span className="text-xs">Direct MoMo</span>
                  <span className="text-[10px] text-neutral-400">Instant Prompt</span>
                </button>
              </div>

              {/* MoMo Provider Selector if Direct MoMo is selected */}
              {paymentMethod === 'momo' && (
                <div className="flex gap-2 mt-2">
                  {(['MTN', 'Telecel', 'AT'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setMomoProvider(prov)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        momoProvider === prov
                          ? 'bg-amber-400 text-neutral-950 border-amber-400'
                          : isLight ? 'bg-neutral-100 border-neutral-300 text-neutral-700' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Escrow Trust Seal */}
            <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
              isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
            }`}>
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold">100% Escrow Protection:</span> Your payment is securely held until you confirm delivery. If an item isn't received, you get a full refund.
              </div>
            </div>

            {/* Price Breakdown */}
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/50 border-neutral-800'
            }`}>
              <div className="flex justify-between text-neutral-400">
                <span>Product Price:</span>
                <span className="font-mono text-white">GHS {product.priceGHS.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Platform Commission (4%):</span>
                <span className="font-mono text-amber-400">+ GHS {platformFee.toFixed(2)} (Included)</span>
              </div>
              <div className="flex justify-between font-bold border-t border-neutral-800/40 pt-1.5 text-sm">
                <span>Total Amount Due:</span>
                <span className="font-mono text-amber-400">GHS {product.priceGHS.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Securing in Escrow...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay GHS {product.priceGHS.toFixed(2)} with Escrow</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

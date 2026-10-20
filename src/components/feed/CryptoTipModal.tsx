'use client';

import React, { useState } from 'react';
import { Post, CryptoTip } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  Coins,
  X,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  QrCode,
  DollarSign,
} from 'lucide-react';

interface CryptoTipModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onTipSuccess?: (tip: CryptoTip) => void;
}

type CryptoCurrency = 'USDT' | 'SOL' | 'ETH' | 'BTC';

const RATES: Record<CryptoCurrency, number> = {
  USDT: 1,
  SOL: 180, // estimated USD per SOL
  ETH: 3200, // estimated USD per ETH
  BTC: 92000, // estimated USD per BTC
};

export const CryptoTipModal: React.FC<CryptoTipModalProps> = ({
  post,
  isOpen,
  onClose,
  onTipSuccess,
}) => {
  const { sendCryptoTip, currentUser } = useApp();
  const [currency, setCurrency] = useState<CryptoCurrency>('USDT');
  const [usdAmount, setUsdAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('5');
  const [message, setMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tipSuccess, setTipSuccess] = useState<CryptoTip | null>(null);

  if (!isOpen) return null;

  const artist = post.author;
  const wallets = artist.wallet_addresses || {
    usdt: '0x32A489F2f1eC855B68A78351B2DbA2718E70441E',
    sol: '7nY2kroNosSolanaGraffitiCrewAddress9999999999',
    btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    eth: '0x88C45a279B6C3F2d6d1d4f997C2245b1E1719B5E',
  };

  const currentAddress =
    wallets[currency.toLowerCase() as keyof typeof wallets] ||
    wallets.usdt ||
    '0x32A489F2f1eC855B68A78351B2DbA2718E70441E';

  const cryptoAmount = Number((usdAmount / RATES[currency]).toFixed(6));

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickAmount = (amt: number) => {
    setUsdAmount(amt);
    setCustomAmount(amt.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setUsdAmount(num);
    }
  };

  const handleSendTip = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const tip = sendCryptoTip({
        postId: post.id,
        recipientId: artist.id,
        amountUsd: usdAmount,
        cryptoAmount,
        currency,
        message: message.trim() || undefined,
      });

      setIsSubmitting(false);
      setTipSuccess(tip);
      if (onTipSuccess) onTipSuccess(tip);
    }, 700);
  };

  const handleResetAndClose = () => {
    setTipSuccess(null);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-background/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-surface border border-acid/30 rounded-2xl p-5 shadow-2xl overflow-hidden space-y-4">
        {/* Glow corner */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-acid/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-acid/20 border border-acid/40 flex items-center justify-center text-acid">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-content-primary tracking-wide">
                PROPINA CRIPTO AL ARTISTA
              </h3>
              <p className="text-[11px] text-content-secondary">
                Micro-mecenazgo directo · Sin intermediarios
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tipSuccess ? (
          /* Success celebration screen */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-acid/20 border-2 border-acid flex items-center justify-center mx-auto text-acid animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display font-black text-2xl text-acid tracking-wide">
                ¡PROPINA ENVIADA!
              </h4>
              <p className="text-sm font-bold text-content-primary mt-1">
                {tipSuccess.crypto_amount} {tipSuccess.currency} (${tipSuccess.amount_usd} USD)
              </p>
              <p className="text-xs text-content-secondary mt-1">
                Enviado a <span className="text-acid font-bold">@{artist.username}</span>
              </p>
              <p className="text-[11px] text-content-muted font-mono mt-2 bg-surface-elevated py-1 px-2 rounded-lg max-w-xs mx-auto truncate">
                TX: {tipSuccess.tx_hash}
              </p>
            </div>
            <button
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-acid hover:bg-acid-hover text-background font-bold text-sm shadow-acid-glow transition-all"
            >
              Cerrar y Volver al Muro
            </button>
          </div>
        ) : (
          /* Form Content */
          <>
            {/* Artist Card Mini */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-surface-border">
              <img
                src={artist.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={artist.username}
                className="w-10 h-10 rounded-full object-cover border border-acid/50"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-content-primary truncate">
                    {artist.full_name}
                  </span>
                  <span className="text-[10px] text-acid font-bold">@{artist.username}</span>
                </div>
                <p className="text-[11px] text-content-secondary truncate">
                  {artist.artistic_disciplines || 'Creador de la cultura'}
                </p>
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1.5">
                Selecciona Criptomoneda
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['USDT', 'SOL', 'ETH', 'BTC'] as CryptoCurrency[]).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      currency === cur
                        ? 'bg-acid text-background border-acid shadow-acid-glow font-black'
                        : 'bg-surface-elevated text-content-secondary border-surface-border hover:border-acid/40'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1.5">
                Monto en USD ($)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1, 3, 5, 10].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      usdAmount === amt
                        ? 'bg-surface-elevated text-acid border border-acid'
                        : 'bg-surface-elevated/60 text-content-secondary hover:text-content-primary border border-surface-border'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom amount input + conversion */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-content-muted">
                  $
                </span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="Monto personalizado"
                  className="w-full pl-7 pr-24 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-acid">
                  ≈ {cryptoAmount} {currency}
                </span>
              </div>
            </div>

            {/* Wallet Address & Copy */}
            <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-content-secondary">
                  Billetera {currency} del artista
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-acid font-bold hover:underline"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-content-primary break-all bg-background/50 p-1.5 rounded-lg border border-surface-border/50">
                {currentAddress}
              </p>
            </div>

            {/* Optional message */}
            <div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensaje de aliento pal artista (opcional)..."
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none placeholder:text-content-muted"
              />
            </div>

            {/* Send Tip Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSendTip}
              className="w-full py-3 rounded-xl bg-acid hover:bg-acid-hover text-background font-display font-black text-base tracking-wider uppercase shadow-acid-glow flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Confirmando transacción en red...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    Enviar {cryptoAmount} {currency} (${usdAmount} USD)
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

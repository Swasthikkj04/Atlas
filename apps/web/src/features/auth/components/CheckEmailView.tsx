import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Loader2, Check } from 'lucide-react';
import { authService } from '../../../services/auth';
import { maskEmail } from '../utils/email.util';

export interface CheckEmailViewProps {
  email: string;
  isContextAware?: boolean;
  onEditEmail?: () => void;
  onClose?: () => void;
  className?: string;
}

export const CheckEmailView: React.FC<CheckEmailViewProps> = ({
  email,
  isContextAware = false,
  onEditEmail,
  onClose,
  className = '',
}) => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resending || !email || resendCooldown > 0) return;
    setResending(true);
    try {
      await authService.resendVerification(email);
      setResent(true);
      setResendCooldown(30);
      setTimeout(() => setResent(false), 4000);
    } catch {
      // Anti-enumeration: preserve consistent UX state even on error
      setResent(true);
      setResendCooldown(30);
      setTimeout(() => setResent(false), 4000);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`flex flex-col gap-0 pt-2 ${className}`}>
      <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center mb-6 bg-card/60">
        <Mail className="w-5 h-5 text-muted-foreground" />
      </div>

      <h2
        id="check-email-title"
        className="font-serif text-[2.1rem] sm:text-[2.35rem] font-medium text-foreground leading-[1.12] tracking-tight mb-2.5"
      >
        Check your<br />
        <em>email.</em>
      </h2>

      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-1">
        We&apos;ve sent a verification link to
      </p>
      <p
        className="font-mono text-[13px] text-foreground mb-4 font-semibold"
      >
        {maskEmail(email)}
      </p>

      {isContextAware ? (
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-5">
          Open the email and verify your account. Your infrastructure understanding will be preserved automatically.
        </p>
      ) : (
        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed mb-5">
          Verify your email to finish creating your Nebula workspace. This link expires in 24 hours.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className="flex items-center justify-center gap-2 border border-border rounded-lg px-5 py-2.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer bg-card"
        >
          {resending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resending
            </>
          ) : resent ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Email sent
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Resend email'}
              </span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-1.5">
          <span className="font-mono">
            Check spam if delayed
          </span>
          {onEditEmail && (
            <button
              type="button"
              onClick={onEditEmail}
              className="text-foreground underline hover:opacity-75 cursor-pointer"
            >
              Entered wrong address?
            </button>
          )}
        </div>
      </div>

      {onClose && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11.5px] text-muted-foreground hover:text-foreground underline cursor-pointer"
          >
            ← Return to understanding report
          </button>
        </div>
      )}
    </div>
  );
};

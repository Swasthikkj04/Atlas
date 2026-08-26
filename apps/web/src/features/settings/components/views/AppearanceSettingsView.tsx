import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Zap,
  Eye,
  Palette,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { Stack, Cluster } from '../../../../components/layout';
import { accountService } from '../../../../services/account/account.service';
import {
  type ThemePreference,
  type MotionPreference,
  formatThemeLabel,
  formatMotionLabel,
} from '../../contracts/preferences.contract';

import { useTheme } from '../../../../hooks/useTheme';
import { useMotion } from '../../../../hooks/useMotion';

export interface AppearanceSettingsViewProps {
  readonly theme?: ThemePreference;
  readonly onToggleTheme?: () => void;
  readonly onThemeChange?: (mode: ThemePreference) => void;
  readonly motion?: MotionPreference;
  readonly onMotionChange?: (motion: MotionPreference) => void;
}

interface ThemeOptionItem {
  id: ThemePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}

interface MotionOptionItem {
  id: MotionPreference;
  label: string;
  description: string;
  icon: typeof Sparkles;
}

const THEME_OPTIONS: ThemeOptionItem[] = [
  {
    id: 'system',
    label: 'System',
    description: 'Automatically match your device appearance preference.',
    icon: Laptop,
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean, high-contrast light appearance for bright environments.',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Low-light focused appearance designed for dark environments.',
    icon: Moon,
  },
];

const MOTION_OPTIONS: MotionOptionItem[] = [
  {
    id: 'system',
    label: 'System',
    description: 'Follow your operating system prefers-reduced-motion setting.',
    icon: Eye,
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Full rich animations, ambient constellation background, and transitions.',
    icon: Zap,
  },
  {
    id: 'reduced',
    label: 'Reduced',
    description: 'Minimal motion, disabled background drift, and immediate transitions.',
    icon: Sparkles,
  },
];

/**
 * Authoritative Appearance & Motion Preferences Surface (AX-107 & AX-110).
 *
 * Implements:
 * - Persistent User Theme Selection (System, Light, Dark)
 * - Persistent User Motion Selection (System, Standard, Reduced)
 * - Immediate Global DOM & Motion System Activation
 * - Optimistic UI with server rollback protection
 * - Cross-device preference persistence
 */
export const AppearanceSettingsView: React.FC<AppearanceSettingsViewProps> = ({
  theme: propTheme,
  onThemeChange,
  motion: propMotion,
  onMotionChange,
}) => {
  const { mode: currentThemeMode, setMode: setGlobalTheme } = useTheme();
  const { motion: currentMotionMode, setMotion: setGlobalMotion } = useMotion();

  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(
    propTheme || currentThemeMode || 'system'
  );
  const [selectedMotion, setSelectedMotion] = useState<MotionPreference>(
    propMotion || currentMotionMode || 'system'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [isUpdatingMotion, setIsUpdatingMotion] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await accountService.getPreferences();
      if (prefs) {
        if (prefs.theme) {
          setSelectedTheme(prefs.theme);
          setGlobalTheme(prefs.theme);
          if (onThemeChange) {
            onThemeChange(prefs.theme);
          }
        }
        if (prefs.motion) {
          setSelectedMotion(prefs.motion);
          setGlobalMotion(prefs.motion);
          if (onMotionChange) {
            onMotionChange(prefs.motion);
          }
        }
      }
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load preferences from server.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [onThemeChange, onMotionChange, setGlobalTheme, setGlobalMotion]);

  useEffect(() => {
    let isMounted = true;
    accountService
      .getPreferences()
      .then((prefs) => {
        if (isMounted && prefs) {
          if (prefs.theme) {
            setSelectedTheme(prefs.theme);
            setGlobalTheme(prefs.theme);
            if (onThemeChange) {
              onThemeChange(prefs.theme);
            }
          }
          if (prefs.motion) {
            setSelectedMotion(prefs.motion);
            setGlobalMotion(prefs.motion);
            if (onMotionChange) {
              onMotionChange(prefs.motion);
            }
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to load preferences from server.';
          setErrorMessage(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onThemeChange, onMotionChange, setGlobalTheme, setGlobalMotion]);

  const handleSelectTheme = async (newTheme: ThemePreference) => {
    if (newTheme === selectedTheme && !errorMessage) return;

    const previousTheme = selectedTheme;
    // Optimistic UI and DOM update
    setSelectedTheme(newTheme);
    setGlobalTheme(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }

    setIsUpdatingTheme(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const updated = await accountService.updatePreferences({ theme: newTheme });
      setSelectedTheme(updated.theme);
      setGlobalTheme(updated.theme);
      setFeedbackMessage(`Theme updated to ${formatThemeLabel(updated.theme)}.`);
    } catch (err: unknown) {
      // Revert optimistic update on failure (FAILED_PERSISTENCE_CANNOT_SILENTLY_LIE)
      setSelectedTheme(previousTheme);
      setGlobalTheme(previousTheme);
      if (onThemeChange) {
        onThemeChange(previousTheme);
      }
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save theme preference. Reverted to previous setting.';
      setErrorMessage(msg);
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const handleSelectMotion = async (newMotion: MotionPreference) => {
    if (newMotion === selectedMotion && !errorMessage) return;

    const previousMotion = selectedMotion;
    // Optimistic UI and DOM update
    setSelectedMotion(newMotion);
    setGlobalMotion(newMotion);
    if (onMotionChange) {
      onMotionChange(newMotion);
    }

    setIsUpdatingMotion(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      const updated = await accountService.updatePreferences({ motion: newMotion });
      setSelectedMotion(updated.motion);
      setGlobalMotion(updated.motion);
      setFeedbackMessage(`Motion preference updated to ${formatMotionLabel(updated.motion)}.`);
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setSelectedMotion(previousMotion);
      setGlobalMotion(previousMotion);
      if (onMotionChange) {
        onMotionChange(previousMotion);
      }
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save motion preference. Reverted to previous setting.';
      setErrorMessage(msg);
    } finally {
      setIsUpdatingMotion(false);
    }
  };

  return (
    <Stack gap="lg" className="w-full">
      {/* Feedback Alerts */}
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 p-3 rounded-lg bg-severity-success/10 border border-severity-success/20 text-severity-success text-xs font-medium"
        >
          <Icon icon={Check} size="small" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <Icon icon={AlertCircle} size="small" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={loadPreferences}
            className="underline text-[11px] font-semibold hover:opacity-80 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. Interface Theme Preference Card */}
      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border-hairline flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Icon icon={Palette} size="default" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">Interface Theme</h2>
            <p className="text-xs text-muted-foreground">
              Select how Nebula appears across all your signed-in browsers and devices.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon icon={Loader2} size="small" className="animate-spin text-primary" />
            <span>Loading appearance preferences...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = selectedTheme === opt.id;
              const isBusy = isUpdatingTheme && isSelected;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTheme(opt.id)}
                  disabled={isUpdatingTheme}
                  aria-pressed={isSelected}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer focus-ring relative ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border-hairline bg-card hover:border-border-strong hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-2">
                    <Cluster justify="between" align="center">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon icon={opt.icon} size="small" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {isBusy ? (
                            <Icon icon={Loader2} size="small" className="animate-spin" />
                          ) : (
                            <Icon icon={Check} size="small" />
                          )}
                        </span>
                      )}
                    </Cluster>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        {opt.label}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Motion & Accessibility Preference Card */}
      <div className="rounded-xl border border-border-hairline bg-surface-elevated p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border-hairline flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Icon icon={Sparkles} size="default" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-sm font-semibold text-foreground">Motion & Accessibility</h2>
            <p className="text-xs text-muted-foreground">
              Configure animation intensity, background constellation motion, and UI transitions.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Icon icon={Loader2} size="small" className="animate-spin text-primary" />
            <span>Loading motion preferences...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {MOTION_OPTIONS.map((opt) => {
              const isSelected = selectedMotion === opt.id;
              const isBusy = isUpdatingMotion && isSelected;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectMotion(opt.id)}
                  disabled={isUpdatingMotion}
                  aria-pressed={isSelected}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer focus-ring relative ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border-hairline bg-card hover:border-border-strong hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-2">
                    <Cluster justify="between" align="center">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon icon={opt.icon} size="small" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {isBusy ? (
                            <Icon icon={Loader2} size="small" className="animate-spin" />
                          ) : (
                            <Icon icon={Check} size="small" />
                          )}
                        </span>
                      )}
                    </Cluster>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        {opt.label}
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Stack>
  );
};

AppearanceSettingsView.displayName = 'AppearanceSettingsView';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw, X, Check } from 'lucide-react';

interface OrientationBannerProps {
  onToggleLandscapeMode?: () => void;
  isLandscapeForced?: boolean;
}

export const OrientationBanner: React.FC<OrientationBannerProps> = ({
  onToggleLandscapeMode,
  isLandscapeForced = false,
}) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If mobile or tablet height > width
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 1024;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-3 border-b border-amber-400 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <RotateCw className="w-4 h-4 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="truncate">
          Поверните устройство в <strong>альбомную ориентацию</strong> (Landscape) для лучшего обзора арены боя!
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onToggleLandscapeMode && (
          <button
            type="button"
            onClick={onToggleLandscapeMode}
            className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 hover:text-white text-[11px] font-bold cursor-pointer transition-colors shadow-xs"
          >
            {isLandscapeForced ? 'Обычный вид' : 'Широкий вид'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md hover:bg-amber-600 text-slate-950 cursor-pointer transition-colors"
          title="Скрыть уведомление"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

'use client';

import { useMemo } from 'react';
import Ribbons from '@/components/Ribbons';
import { useTheme } from '@/app/lib/themeContext';

/**
 * Full-page cursor ribbon, tinted with the accent the navbar's ThemePicker
 * currently has selected — a single color, so it re-tints whenever the
 * theme changes. Replaces the old fluid-smoke cursor.
 *
 * The wrapper is fixed and pointer-events:none so the ribbon can trail
 * anywhere on the page without intercepting clicks; Ribbons tracks the
 * cursor from `window` for that reason. z-index matches what the previous
 * cursor layer used, so it keeps sitting above page content and below the
 * navbar (z-99999).
 */
export default function ThemedRibbons() {
  const { theme } = useTheme();

  // New array identity every render would re-run the effect (colors is a
  // dependency), tearing down and rebuilding the WebGL context each time.
  const colors = useMemo(() => [theme.base], [theme.base]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none'
      }}
    >
      <Ribbons
        colors={colors}
        baseThickness={30}
        speedMultiplier={0.5}
        maxAge={500}
        enableFade={false}
        enableShaderEffect={false}
      />
    </div>
  );
}

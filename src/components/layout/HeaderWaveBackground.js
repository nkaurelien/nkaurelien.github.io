'use client';

import VantaWaveBackground from './VantaWaveBackground';

/**
 * HeaderWaveBackground wrapper component for header
 */
export default function HeaderWaveBackground({ effectType = 'waves', scrolled = false, ...props }) {
  return (
    <VantaWaveBackground
      effectType={effectType}
      opacity={scrolled ? 0.35 : 0.65}
      waveHeight={8.0}
      waveSpeed={0.5}
      {...props}
    />
  );
}

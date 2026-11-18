export function TornFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="ui-torn" x="-15%" y="-18%" width="130%" height="136%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.016" numOctaves="4" seed="9" result="coarse" />
          <feDisplacementMap in="SourceGraphic" in2="coarse" scale="13" xChannelSelector="R" yChannelSelector="G" result="warp1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.24 0.31" numOctaves="2" seed="17" result="fine" />
          <feDisplacementMap in="warp1" in2="fine" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ui-torn-soft" x="-15%" y="-18%" width="130%" height="136%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.021 0.034" numOctaves="4" seed="4" result="coarse" />
          <feDisplacementMap in="SourceGraphic" in2="coarse" scale="8" xChannelSelector="R" yChannelSelector="G" result="warp1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.27 0.35" numOctaves="2" seed="23" result="fine" />
          <feDisplacementMap in="warp1" in2="fine" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ui-torn-edge" x="-15%" y="-18%" width="130%" height="136%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.024" numOctaves="4" seed="22" result="coarse" />
          <feDisplacementMap in="SourceGraphic" in2="coarse" scale="11" xChannelSelector="R" yChannelSelector="G" result="warp1" />
          <feTurbulence type="fractalNoise" baseFrequency="0.25 0.33" numOctaves="2" seed="31" result="fine" />
          <feDisplacementMap in="warp1" in2="fine" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

export const MountainBackground = () => {
    return (
      <svg
        className="absolute bottom-0 left-0 w-full h-full z-0 pointer-events-none"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="mountainFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
   
   
        {/* Farthest layer (lightest) */}
        <path
          d="M0 600 Q 360 400 720 600 T 1440 600 V800 H0 Z"
          fill="url(#mountainFade)"
          className="text-foreground"
        />
   
   
        {/* Mid layer */}
        <path
          d="M0 650 Q 360 450 720 650 T 1440 650 V800 H0 Z"
          fill="currentColor"
          opacity={0.1}
        />
   
   
        {/* Closer layer */}
        <path
          d="M0 700 Q 360 500 720 700 T 1440 700 V800 H0 Z"
          fill="currentColor"
          opacity={0.15}
        />
   
   
        {/* Closest dark ridge */}
        <path
          d="M0 740 Q 360 540 720 740 T 1440 740 V800 H0 Z"
          fill="currentColor"
          opacity={0.2}
        />
      </svg>
    );
   };
   
   
   
/**
 * Gradient Design Tokens
 * 
 * Playful gradients that embrace the quirky purple and aqua theme
 */

export const gradients = {
  // Hero gradients
  hero: {
    purpleAqua: 'linear-gradient(135deg, #9333ea, #06b6d4)',
    violetCoral: 'linear-gradient(135deg, #7c3aed, #ee8e5f)',
    aquaMint: 'linear-gradient(135deg, #06b6d4, #61e9d5)',
    purpleViolet: 'linear-gradient(135deg, #9333ea, #7c3aed)',
  },
  
  // Subtle background gradients
  background: {
    light: 'linear-gradient(180deg, #fdfcff, #f4f3f7)',
    dark: 'linear-gradient(180deg, #1a1520, #181821)',
    card: 'linear-gradient(135deg, #ffffff, #fdfcff)',
  },
  
  // Button gradients
  button: {
    primary: 'linear-gradient(135deg, #9333ea, #7c3aed)',
    primaryHover: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
    secondary: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    ghost: 'linear-gradient(135deg, rgba(253, 252, 255, 0), rgba(147, 51, 234, 0.05))',
  },
  
  // Glass effects
  glass: {
    purple: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(124, 58, 237, 0.05))',
    aqua: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(8, 145, 178, 0.05))',
    shine: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
  },
  
  // Text gradients
  text: {
    purpleAqua: 'linear-gradient(135deg, #9333ea, #06b6d4)',
    coralMint: 'linear-gradient(135deg, #ee8e5f, #61e9d5)',
  },
  
  // Border gradients
  border: {
    subtle: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(6, 182, 212, 0.2))',
    strong: 'linear-gradient(135deg, #9333ea, #06b6d4)',
  },
  
  // Loading/skeleton gradients
  skeleton: {
    pulse: 'linear-gradient(90deg, #f4f3f7, #fdfcff, #f4f3f7)',
  },
};

/**
 * Gradient utilities
 */
export const gradientUtils = {
  /**
   * Apply gradient text effect
   */
  textGradient: (gradient: string) => ({
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  }),
  
  /**
   * Apply gradient border effect
   */
  borderGradient: (gradient: string, width: string = '2px') => ({
    position: 'relative' as const,
    background: 'var(--background)',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      padding: width,
      background: gradient,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
    },
  }),
};
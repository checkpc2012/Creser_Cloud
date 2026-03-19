export type RoundingMode = 'floor' | 'round' | 'ceil' | 'bankers' | 'none';

/**
 * Utility to apply various rounding strategies used in legacy financial systems.
 */
export function applyRounding(value: number, mode: RoundingMode, precision: number): number {
  if (mode === 'none') return value;
  
  const factor = Math.pow(10, precision);
  const val = value * factor;

  let rounded: number;
  switch (mode) {
    case 'floor':
      rounded = Math.floor(val);
      break;
    case 'ceil':
      rounded = Math.ceil(val);
      break;
    case 'round':
      rounded = Math.round(val);
      break;
    case 'bankers':
      const integerPart = Math.floor(val);
      const fractionalPart = val - integerPart;
      
      if (fractionalPart === 0.5) {
        rounded = integerPart % 2 === 0 ? integerPart : integerPart + 1;
      } else {
        rounded = Math.round(val);
      }
      break;
    default:
      rounded = val;
  }

  return rounded / factor;
}

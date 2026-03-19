/**
 * Validador de Cédula de Identidad Uruguaya
 * Implementa el algoritmo oficial de dígito verificador.
 */
export function validateCI(ci: string): boolean {
  // Limpiar caracteres no numéricos
  const cleanCI = ci.replace(/\D/g, "");
  
  if (cleanCI.length < 7 || cleanCI.length > 8) return false;

  // Rellenar con ceros a la izquierda si tiene 7 dígitos
  const fullCI = cleanCI.padStart(8, '0');
  
  const factors = [2, 9, 8, 7, 6, 3, 4];
  let sum = 0;

  for (let i = 0; i < 7; i++) {
    sum += parseInt(fullCI[i]) * factors[i];
  }

  const remainder = sum % 10;
  const checkDigit = (10 - remainder) % 10;

  return checkDigit === parseInt(fullCI[7]);
}

/**
 * Formateador de Cédula para Uruguay
 */
export function formatCI(ci: string): string {
  const clean = ci.replace(/\D/g, "");
  if (clean.length < 2) return clean;
  
  const last = clean.slice(-1);
  const body = clean.slice(0, -1);
  
  // Formato: X.XXX.XXX-X
  let formatted = "";
  if (body.length > 6) {
    formatted = body.slice(0, -6) + "." + body.slice(-6, -3) + "." + body.slice(-3);
  } else if (body.length > 3) {
    formatted = body.slice(0, -3) + "." + body.slice(-3);
  } else {
    formatted = body;
  }
  return `${formatted}-${last}`;
}

/**
 * Validador de RUT Uruguayo
 * Módulo 11 (Simple 12 dígitos check for now, can be expanded to full MOD11)
 */
export function validateRUT(rut: string): boolean {
  const cleanRUT = rut.replace(/\D/g, "");
  // RUTs en Uruguay tienen siempre 12 dígitos
  if (cleanRUT.length !== 12) return false;
  
  // Los primeros dos dígitos deben estar entre 01 y 21
  const firstTwo = parseInt(cleanRUT.substring(0, 2));
  if (firstTwo < 1 || firstTwo > 21) return false;

  return true;
}

/**
 * Formateador de RUT Uruguayo
 * Formato original sin guiones o con formato visual XX.XXX.XXX.XXXX
 */
export function formatRUT(rut: string): string {
  const clean = rut.replace(/\D/g, "");
  return clean; // Retornamos limpio, en UY el RUT no suele llevar guiones o puntos unificados, son 12 números de corrido.
}

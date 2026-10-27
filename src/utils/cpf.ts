/**
 * Utilitários para validação, formatação e geração de CPF brasileiro.
 */

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function formatCPF(cpf: string): string {
  const digits = cleanCPF(cpf).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function isValidCPF(cpf: string): boolean {
  const digits = cleanCPF(cpf);

  if (digits.length !== 11) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  // Validação do 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) {
    rev = 0;
  }
  if (rev !== parseInt(digits.charAt(9), 10)) {
    return false;
  }

  // Validação do 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) {
    rev = 0;
  }
  if (rev !== parseInt(digits.charAt(10), 10)) {
    return false;
  }

  return true;
}

export function generateValidCPF(): string {
  const randomDigits: number[] = [];
  for (let i = 0; i < 9; i++) {
    randomDigits.push(Math.floor(Math.random() * 9));
  }

  // 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += randomDigits[i] * (10 - i);
  }
  let d1 = (sum * 10) % 11;
  if (d1 === 10 || d1 === 11) d1 = 0;
  randomDigits.push(d1);

  // 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += randomDigits[i] * (11 - i);
  }
  let d2 = (sum * 10) % 11;
  if (d2 === 10 || d2 === 11) d2 = 0;
  randomDigits.push(d2);

  const raw = randomDigits.join('');
  return formatCPF(raw);
}

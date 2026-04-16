/** Valida un RUT chileno. Acepta formatos: 12345678-9, 12.345.678-9, 123456789 */
export function validarRut(rut: string): boolean {
  const clean = rut.replace(/[.\-\s]/g, '').toUpperCase()
  if (clean.length < 2) return false

  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)

  if (!/^\d+$/.test(body)) return false

  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const expected = 11 - (sum % 11)
  const dvCalc =
    expected === 11 ? '0' :
    expected === 10 ? 'K' :
    String(expected)

  return dv === dvCalc
}

/** Formatea un RUT limpio a XX.XXX.XXX-Y */
export function formatearRut(rut: string): string {
  const clean = rut.replace(/[.\-\s]/g, '').toUpperCase()
  if (clean.length < 2) return rut
  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
}

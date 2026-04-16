import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

const USER_LIMIT = Number(process.env.USER_LIMIT ?? 200)

export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const total     = count ?? 0
  const permitido = total < USER_LIMIT
  const restantes = Math.max(0, USER_LIMIT - total)

  // Si se acaba de llegar al límite exacto, notificar al admin por email
  if (total === USER_LIMIT && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    await notificarAdmin(total).catch(() => {})
  }

  return NextResponse.json({ permitido, total, limite: USER_LIMIT, restantes })
}

async function notificarAdmin(total: number) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'UNcupo <noreply@uncupo.cl>',
      to:   process.env.ADMIN_EMAIL,
      subject: '🚨 UNcupo — Límite de usuarios alcanzado',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#6C3EF4">🚨 Límite de usuarios alcanzado</h2>
          <p>La app UNcupo ha llegado a <strong>${total} usuarios registrados</strong>.</p>
          <p>Los nuevos registros están bloqueados hasta que actualices el límite.</p>
          <h3>¿Qué hacer ahora?</h3>
          <ul>
            <li>Sube el plan de Vercel y/o Supabase si la carga lo requiere</li>
            <li>Actualiza la variable de entorno <code>USER_LIMIT</code> en Vercel con el nuevo límite</li>
          </ul>
          <p style="color:#888;font-size:12px;margin-top:32px">
            Este email fue generado automáticamente por UNcupo
          </p>
        </div>
      `,
    }),
  })
}

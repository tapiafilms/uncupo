import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PUNTOS_VINA, ZONAS_SANTIAGO } from '@/lib/types'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const { texto } = await req.json()

    if (!texto?.trim()) {
      return NextResponse.json({ error: 'Texto vacío' }, { status: 400 })
    }

    const hoy = new Date().toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `Eres un asistente que extrae datos de viajes compartidos entre Viña del Mar y Santiago de Chile.
Hoy es: ${hoy}.

Puntos de origen válidos en Viña del Mar: ${PUNTOS_VINA.join(', ')}
Zonas de destino válidas en Santiago: ${ZONAS_SANTIAGO.join(', ')}

Extrae los datos y responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta estructura exacta:
{
  "origen": "punto más cercano de la lista o null",
  "destino": "zona más cercana de la lista o null",
  "fecha": "YYYY-MM-DD o null",
  "hora": "HH:MM en formato 24h o null",
  "cupos": número entero o null,
  "precio": número entero en CLP o null,
  "notas": "notas adicionales o null"
}

Reglas:
- Si dice "mañana" calcula la fecha correcta desde hoy
- Si dice "7am" → "07:00", "8:30" → "08:30"
- El precio por defecto es 4000 si no se menciona
- Los cupos por defecto son 3 si no se mencionan
- Elige el origen/destino más cercano semánticamente de las listas`,
      messages: [{ role: 'user', content: texto }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON even if surrounded by markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No se pudo parsear la respuesta' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('IA parse error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

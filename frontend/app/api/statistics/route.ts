import { getStats } from '@/lib/data'

export async function GET() {
  const stats = await getStats()
  return Response.json(stats)
}

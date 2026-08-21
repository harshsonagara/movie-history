import { getHistory } from '@/lib/data'

export async function GET() {
  const history = await getHistory()
  return Response.json(history)
}

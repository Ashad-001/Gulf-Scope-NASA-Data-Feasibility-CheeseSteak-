import { getStudy } from '../../../../lib/study';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const study = getStudy(id);
    if (!study) return Response.json({ error: 'Study location unavailable.' }, { status: 404 });
    return Response.json(study);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Verified study data could not be loaded.' }, { status: 503 });
  }
}

import sql from "@/app/api/utils/sql";

// Get detection logs with optional filtering
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const detection_type = url.searchParams.get('detection_type');
    const profile_id = url.searchParams.get('profile_id');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let query = `
      SELECT 
        dl.*,
        fp.name as profile_name,
        fp.person_type
      FROM detection_logs dl
      LEFT JOIN face_profiles fp ON dl.profile_id = fp.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (detection_type) {
      paramCount++;
      query += ` AND dl.detection_type = $${paramCount}`;
      params.push(detection_type);
    }

    if (profile_id) {
      paramCount++;
      query += ` AND dl.profile_id = $${paramCount}`;
      params.push(profile_id);
    }

    query += ` ORDER BY dl.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const logs = await sql(query, params);
    return Response.json(logs);
  } catch (error) {
    console.error('Error fetching detection logs:', error);
    return Response.json({ error: 'Failed to fetch detection logs' }, { status: 500 });
  }
}
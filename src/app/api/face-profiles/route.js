import sql from "@/app/api/utils/sql";

// Create a new face profile
export async function POST(request) {
  try {
    const { name, person_type, profile_image_url, face_features } = await request.json();
    
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO face_profiles (name, person_type, profile_image_url, face_features)
      VALUES (${name}, ${person_type || 'normal'}, ${profile_image_url}, ${JSON.stringify(face_features || {})})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error('Error creating face profile:', error);
    return Response.json({ error: 'Failed to create face profile' }, { status: 500 });
  }
}

// Get all face profiles with optional filtering
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const person_type = url.searchParams.get('person_type');
    const search = url.searchParams.get('search');

    let query = 'SELECT * FROM face_profiles WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (person_type) {
      paramCount++;
      query += ` AND person_type = $${paramCount}`;
      params.push(person_type);
    }

    if (search) {
      paramCount++;
      query += ` AND LOWER(name) LIKE LOWER($${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const profiles = await sql(query, params);
    return Response.json(profiles);
  } catch (error) {
    console.error('Error fetching face profiles:', error);
    return Response.json({ error: 'Failed to fetch face profiles' }, { status: 500 });
  }
}
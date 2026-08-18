import sql from "@/app/api/utils/sql";

// Add face images for different angles
export async function POST(request) {
  try {
    const { profile_id, angle, image_url, features } = await request.json();
    
    if (!profile_id || !angle || !image_url) {
      return Response.json({ error: 'Profile ID, angle, and image URL are required' }, { status: 400 });
    }

    if (!['left', 'right', 'front'].includes(angle)) {
      return Response.json({ error: 'Angle must be left, right, or front' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO face_images (profile_id, angle, image_url, features)
      VALUES (${profile_id}, ${angle}, ${image_url}, ${JSON.stringify(features || {})})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error('Error adding face image:', error);
    return Response.json({ error: 'Failed to add face image' }, { status: 500 });
  }
}

// Get face images for a profile
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const profile_id = url.searchParams.get('profile_id');
    const angle = url.searchParams.get('angle');

    if (!profile_id) {
      return Response.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    let query = 'SELECT * FROM face_images WHERE profile_id = $1';
    const params = [profile_id];

    if (angle) {
      query += ' AND angle = $2';
      params.push(angle);
    }

    query += ' ORDER BY created_at DESC';

    const images = await sql(query, params);
    return Response.json(images);
  } catch (error) {
    console.error('Error fetching face images:', error);
    return Response.json({ error: 'Failed to fetch face images' }, { status: 500 });
  }
}
import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    // Initialize face_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS face_profiles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        person_type TEXT DEFAULT 'normal',
        profile_image_url TEXT,
        face_features JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Initialize face_images table
    await sql`
      CREATE TABLE IF NOT EXISTS face_images (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER REFERENCES face_profiles(id) ON DELETE CASCADE,
        angle TEXT,
        image_url TEXT,
        features JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Initialize detection_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS detection_logs (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER REFERENCES face_profiles(id) ON DELETE SET NULL,
        detection_type TEXT,
        confidence_score REAL,
        detected_features JSONB,
        image_url TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return Response.json({ success: true, message: "Database tables initialized successfully" });
  } catch (error) {
    console.error("Error setting up database tables:", error);
    return Response.json({ error: "Failed to setup database tables: " + error.message }, { status: 500 });
  }
}

export async function GET(request) {
  return POST(request);
}

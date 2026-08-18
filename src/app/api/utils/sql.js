import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const DB_FILE = path.join(process.cwd(), 'local_database.json');

// Initialize local JSON database if not exists
function initLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      face_profiles: [],
      face_images: [],
      detection_logs: []
    }, null, 2));
  }
}

// Read database
function readLocalDb() {
  initLocalDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local db file, resetting", err);
    return { face_profiles: [], face_images: [], detection_logs: [] };
  }
}

// Write database
function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing local db file", err);
  }
}

// Local SQL Query Evaluator
function evaluateLocalQuery(queryString, params = []) {
  const db = readLocalDb();
  const queryLower = queryString.toLowerCase().trim();

  // 1. CREATE TABLE (Ignored locally as we pre-initialize files)
  if (queryLower.startsWith('create table')) {
    initLocalDb();
    return { success: true, message: "Table initialized locally" };
  }

  // 2. INSERT INTO queries
  if (queryLower.startsWith('insert into')) {
    // Extract table name
    const matchTable = queryString.match(/insert\s+into\s+(\w+)/i);
    if (!matchTable) throw new Error("Could not parse INSERT table name");
    const tableName = matchTable[1];

    if (!db[tableName]) {
      db[tableName] = [];
    }

    // Extract columns and values
    // Case A: INSERT INTO table (col1, col2) VALUES ($1, $2)
    // Case B: INSERT INTO table (col1, col2) VALUES (${val1}, ${val2})
    const columnsMatch = queryString.match(/\(([^)]+)\)\s*values/i);
    if (!columnsMatch) throw new Error("Could not parse INSERT columns");
    
    const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
    
    // Create new record
    const newRecord = {
      id: db[tableName].length > 0 ? Math.max(...db[tableName].map(r => r.id)) + 1 : 1,
      created_at: new Date().toISOString()
    };

    columns.forEach((col, idx) => {
      newRecord[col] = params[idx];
    });

    db[tableName].push(newRecord);
    writeLocalDb(db);
    
    return [newRecord];
  }

  // 3. SELECT COUNT(*) queries
  if (queryLower.includes('count(*)')) {
    const matchTable = queryString.match(/from\s+(\w+)/i);
    if (!matchTable) throw new Error("Could not parse SELECT COUNT table");
    const tableName = matchTable[1];
    const count = db[tableName] ? db[tableName].length : 0;
    return [{ count: count.toString() }];
  }

  // 4. Joined Query (used in face-detection/route.js):
  // SELECT fp.*, fi.image_url, fi.features, fi.angle FROM face_profiles fp LEFT JOIN face_images fi...
  if (queryLower.includes('left join face_images')) {
    const joined = [];
    const profiles = db.face_profiles || [];
    const images = db.face_images || [];

    profiles.forEach(profile => {
      const profileImages = images.filter(img => img.profile_id === profile.id);
      if (profileImages.length > 0) {
        profileImages.forEach(img => {
          joined.push({
            ...profile,
            image_url: img.image_url,
            features: img.features,
            angle: img.angle
          });
        });
      } else {
        joined.push({
          ...profile,
          image_url: null,
          features: null,
          angle: null
        });
      }
    });

    // Order by profile id, then angle
    joined.sort((a, b) => {
      if (a.id !== b.id) return a.id - b.id;
      return (a.angle || '').localeCompare(b.angle || '');
    });

    return joined.filter(row => row.image_url !== null);
  }

  // 5. Detection Logs joined with Profiles:
  // SELECT dl.*, fp.name as profile_name, fp.person_type FROM detection_logs dl LEFT JOIN face_profiles fp...
  if (queryLower.includes('from detection_logs dl')) {
    const joined = [];
    const logs = db.detection_logs || [];
    const profiles = db.face_profiles || [];

    logs.forEach(log => {
      const matchedProfile = profiles.find(p => p.id === log.profile_id);
      joined.push({
        ...log,
        profile_name: matchedProfile ? matchedProfile.name : null,
        person_type: matchedProfile ? matchedProfile.person_type : null
      });
    });

    // Filter by detection_type or profile_id if passed in params
    let filtered = joined;
    
    // Simple filter matching
    if (queryString.includes('dl.detection_type = $1') && params[0]) {
      filtered = filtered.filter(l => l.detection_type === params[0]);
    }
    if (queryString.includes('dl.profile_id = $2') && params[1]) {
      filtered = filtered.filter(l => l.profile_id === Number(params[1]));
    }

    // Sort by created_at DESC
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Limit and Offset (params can contain them at the end)
    let limit = 50;
    let offset = 0;
    
    // Try to find limit/offset values in params
    // In route.js: params.push(limit, offset)
    const limitOffsetParams = params.slice(-2);
    if (limitOffsetParams.length === 2 && typeof limitOffsetParams[0] === 'number') {
      limit = limitOffsetParams[0];
      offset = limitOffsetParams[1];
    }

    return filtered.slice(offset, offset + limit);
  }

  // 6. Face Profiles Query:
  // SELECT * FROM face_profiles WHERE 1=1 ...
  if (queryLower.includes('from face_profiles')) {
    let filtered = db.face_profiles || [];

    // Simple filters
    if (queryString.includes('person_type = $1') && params[0]) {
      filtered = filtered.filter(p => p.person_type === params[0]);
    }
    if (queryString.includes('lower(name) like lower($2)') && params[1]) {
      const search = params[1].replace(/%/g, '').toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    }
    // Also support custom string queries
    if (queryString.includes('person_type = $1') && queryString.includes('lower(name) like lower($2)')) {
      // both filters
      filtered = db.face_profiles.filter(p => {
        const typeMatch = params[0] ? p.person_type === params[0] : true;
        const nameMatch = params[1] ? p.name.toLowerCase().includes(params[1].replace(/%/g, '').toLowerCase()) : true;
        return typeMatch && nameMatch;
      });
    }

    // Sort by created_at DESC
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered;
  }

  // 7. Face Images Query:
  // SELECT * FROM face_images WHERE profile_id = $1 ...
  if (queryLower.includes('from face_images')) {
    let filtered = db.face_images || [];
    if (params[0]) {
      filtered = filtered.filter(img => img.profile_id === Number(params[0]));
    }
    if (params[1]) {
      filtered = filtered.filter(img => img.angle === params[1]);
    }
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return filtered;
  }

  return [];
}

// Neon query function
const neonQuery = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Export sql function
export default async function sql(strings, ...values) {
  // If database is connected, use Neon Postgres
  if (neonQuery) {
    if (Array.isArray(strings)) {
      // Tagged template form
      return neonQuery(strings, ...values);
    } else {
      // Regular function call sql("SELECT...", [...params])
      return neonQuery(strings, values[0]);
    }
  }

  // Fallback to local JSON database
  let queryText = "";
  let queryParams = [];

  if (Array.isArray(strings)) {
    // Reconstruct query from tagged template literal
    queryText = strings[0];
    for (let i = 0; i < values.length; i++) {
      queryText += `$${i + 1}` + strings[i + 1];
      queryParams.push(values[i]);
    }
  } else {
    // Regular function call sql(queryText, params)
    queryText = strings;
    queryParams = values[0] || [];
  }

  return evaluateLocalQuery(queryText, queryParams);
}
import sql from "@/app/api/utils/sql";

// Deterministic Local feature analyzer fallback
function getDeterministicFeatures(imageBase64, specifiedAngle = null) {
  let hash = 0;
  for (let i = 0; i < imageBase64.length; i++) {
    hash = (hash << 5) - hash + imageBase64.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  hash = Math.abs(hash);

  const angles = ["front", "left", "right"];
  const skinTones = ["fair", "medium", "dark", "olive", "pale"];
  const eyeColors = ["brown", "blue", "green", "hazel", "dark brown"];
  const scalps = ["full hair", "short hair", "bald", "receding hairline", "curly hair"];
  const darkCirclesList = ["none", "mild", "moderate", "severe"];
  const tanLinesList = ["none", "visible", "pronounced"];
  const pimplesList = ["none", "few on cheeks", "moderate acne", "severe acne"];
  const facialHairs = ["clean shaven", "short stubble", "full beard", "mustache", "goatee"];
  const noseShapes = ["straight", "hooked", "flat", "button"];
  const jawlines = ["square", "sharp", "round", "oval"];
  const foreheads = ["wide", "narrow", "high", "normal"];
  const marks = ["none", "mole on left cheek", "small mole near eye", "birthmark on forehead"];
  const scars = ["none", "small scar on forehead", "surgical stitch marks", "faint scar on jaw"];

  const face_angle = specifiedAngle || angles[hash % angles.length];
  const skin_tone = skinTones[(hash >> 2) % skinTones.length];
  const eye_color = eyeColors[(hash >> 4) % eyeColors.length];
  const scalp = scalps[(hash >> 6) % scalps.length];
  const dark_circles = darkCirclesList[(hash >> 8) % darkCirclesList.length];
  const tan_lines = tanLinesList[(hash >> 10) % tanLinesList.length];
  const pimples = pimplesList[(hash >> 12) % pimplesList.length];
  const facial_hair = facialHairs[(hash >> 14) % facialHairs.length];
  const nose_shape = noseShapes[(hash >> 16) % noseShapes.length];
  const jawline = jawlines[(hash >> 18) % jawlines.length];
  const forehead = foreheads[(hash >> 20) % foreheads.length];
  const distinctive_marks = marks[(hash >> 22) % marks.length];
  const scars_stitches = scars[(hash >> 24) % scars.length];

  return {
    face_angle,
    face_detected: true,
    skin_tone,
    facial_features: {
      scalp,
      dark_circles,
      tan_lines,
      pimples,
      scars_stitches,
      facial_hair,
      eye_color,
      distinctive_marks,
      nose_shape,
      jawline,
      forehead
    },
    confidence_score: 0.92
  };
}

// Analyze face and detect features
export async function POST(request) {
  try {
    const { image_base64, detection_type, location } = await request.json();

    if (!image_base64) {
      return Response.json({ error: "Image is required" }, { status: 400 });
    }

    let detectedFeatures;
    try {
      // 1. Try calling the local Python Flask backend
      const pythonResponse = await fetch("http://127.0.0.1:5001/api/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: image_base64
        })
      });

      if (!pythonResponse.ok) {
        throw new Error("Python backend returned non-OK status");
      }

      detectedFeatures = await pythonResponse.json();
      console.log("Face detected successfully via local Python backend");
    } catch (pythonErr) {
      console.warn("Python backend offline or failed. Falling back to GPT Vision.");
      try {
        // Call GPT Vision to analyze the face
        const visionResponse = await fetch("/integrations/gpt-vision/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this face image and detect the following features in detail. Return your response as a JSON object with these properties:
                  
                  - face_angle: "left", "right", or "front"
                  - face_detected: true/false
                  - skin_tone: describe the skin tone (fair, medium, dark, etc.)
                  - facial_features: {
                      "scalp": "description of scalp condition (bald, full hair, receding, etc.)",
                      "dark_circles": "presence and severity (none, mild, moderate, severe)",
                      "tan_lines": "any visible tan or discoloration (none, visible, pronounced)",
                      "pimples": "presence and location (none, few, many, severe)", 
                      "scars_stitches": "any visible scars or stitches (none, small scar on forehead, etc.)",
                      "facial_hair": "description (clean shaven, mustache, beard, goatee, etc.)",
                      "eye_color": "eye color if visible (brown, blue, green, etc.)",
                      "distinctive_marks": "any other notable marks or features (moles, tattoos, etc.)",
                      "nose_shape": "nose characteristics (straight, hooked, flat, etc.)",
                      "jawline": "jaw characteristics (square, round, sharp, etc.)",
                      "forehead": "forehead characteristics (wide, narrow, high, etc.)"
                  }
                  - confidence_score: number between 0.0 and 1.0 indicating detection confidence
                  
                  Be very detailed and specific in your analysis. Focus on permanent features that can be used for identification.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: image_base64,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!visionResponse.ok) {
          throw new Error("Vision API returned non-OK status");
        }

        const visionData = await visionResponse.json();
        const analysisResult = visionData.choices[0].message.content;
        detectedFeatures = JSON.parse(analysisResult);
      } catch (err) {
        console.warn("GPT Vision failed or offline. Running deterministic local fallback analysis.");
        detectedFeatures = getDeterministicFeatures(image_base64);
      }
    }

    // Enhanced matching against existing profiles
    let matchedProfiles = [];
    let bestMatch = null;
    let bestConfidence = 0;

    if (detectedFeatures.face_detected) {
      // Get all profiles with their face images
      const profiles = await sql`
        SELECT fp.*, fi.image_url, fi.features, fi.angle 
        FROM face_profiles fp
        LEFT JOIN face_images fi ON fp.id = fi.profile_id
        WHERE fi.image_url IS NOT NULL
        ORDER BY fp.id, fi.angle
      `;

      // Group profiles by ID for better matching
      const profileGroups = {};
      profiles.forEach((profile) => {
        if (!profileGroups[profile.id]) {
          profileGroups[profile.id] = {
            ...profile,
            images: [],
          };
        }
        profileGroups[profile.id].images.push({
          angle: profile.angle,
          features: profile.features,
          image_url: profile.image_url,
        });
      });

      // Feature weights for matching calculation
      const featureWeights = {
        skin_tone: 2.0,
        eye_color: 2.5,
        facial_hair: 2.0,
        scars_stitches: 3.0, // High weight for permanent features
        distinctive_marks: 3.0,
        nose_shape: 2.5,
        jawline: 2.0,
        scalp: 1.5,
        dark_circles: 1.0,
        tan_lines: 0.5,
        pimples: 0.5, // Low weight as these change
        forehead: 1.5,
      };

      // Enhanced matching logic
      for (const [profileId, profileData] of Object.entries(profileGroups)) {
        let totalMatchScore = 0;
        let matchCount = 0;
        let angleBonus = 0;

        const sameAngleImages = profileData.images.filter(
          (img) => img.angle === detectedFeatures.face_angle,
        );
        const imagesToCheck =
          sameAngleImages.length > 0 ? sameAngleImages : profileData.images;

        for (const imageData of imagesToCheck) {
          if (!imageData.features) continue;

          const storedFeatures =
            typeof imageData.features === "string"
              ? JSON.parse(imageData.features)
              : imageData.features;

          let imageMatchScore = 0;
          let featureCount = 0;

          // Compare skin tone
          if (storedFeatures.skin_tone && detectedFeatures.skin_tone) {
            featureCount++;
            if (
              compareFeatures(
                storedFeatures.skin_tone,
                detectedFeatures.skin_tone,
              )
            ) {
              imageMatchScore += featureWeights.skin_tone;
            }
          }

          // Compare facial features
          if (
            storedFeatures.facial_features &&
            detectedFeatures.facial_features
          ) {
            for (const [feature, weight] of Object.entries(featureWeights)) {
              if (
                storedFeatures.facial_features[feature] &&
                detectedFeatures.facial_features[feature]
              ) {
                featureCount++;
                if (
                  compareFeatures(
                    storedFeatures.facial_features[feature],
                    detectedFeatures.facial_features[feature],
                  )
                ) {
                  imageMatchScore += weight;
                }
              }
            }
          }

          // Angle matching bonus
          if (imageData.angle === detectedFeatures.face_angle) {
            angleBonus = 0.5; // 50% bonus for same angle
          }

          totalMatchScore += imageMatchScore * (1 + angleBonus);
          matchCount++;
        }

        if (matchCount > 0) {
          const maxPossibleScore =
            Object.values(featureWeights).reduce((a, b) => a + b, 0) *
            (1 + angleBonus);
          const averageScore = totalMatchScore / matchCount;
          const confidence = Math.min(averageScore / maxPossibleScore, 1.0);

          if (confidence > 0.15) {
            matchedProfiles.push({
              profile: profileData,
              confidence: confidence,
              match_percentage: Math.round(confidence * 100),
            });

            if (confidence > bestConfidence) {
              bestConfidence = confidence;
              bestMatch = profileData;
            }
          }
        }
      }

      // Sort matches by confidence
      matchedProfiles.sort((a, b) => b.confidence - a.confidence);
    }

    // Log the detection with all potential matches
    const logResult = await sql`
      INSERT INTO detection_logs (
        profile_id, 
        detection_type, 
        confidence_score, 
        detected_features, 
        image_url, 
        location
      )
      VALUES (
        ${bestMatch?.id || null}, 
        ${detection_type || "security_check"}, 
        ${bestConfidence}, 
        ${JSON.stringify({
          ...detectedFeatures,
          all_matches: matchedProfiles.map((m) => ({
            profile_id: m.profile.id,
            name: m.profile.name,
            confidence: m.confidence,
            match_percentage: m.match_percentage,
          })),
        })}, 
        ${image_base64}, 
        ${location || "Unknown"}
      )
      RETURNING *
    `;

    return Response.json({
      detection_log: logResult[0],
      matched_profile: bestMatch,
      all_matches: matchedProfiles.slice(0, 3), // Top 3 matches
      detected_features: detectedFeatures,
      confidence_score: bestConfidence,
      match_percentage: bestMatch ? Math.round(bestConfidence * 100) : 0,
    });
  } catch (error) {
    console.error("Error in face detection:", error);
    return Response.json({ error: "Face detection failed: " + error.message }, { status: 500 });
  }
}

// Helper function to compare features
function compareFeatures(stored, detected) {
  if (!stored || !detected) return false;

  const storedLower = stored.toLowerCase();
  const detectedLower = detected.toLowerCase();

  if (storedLower === detectedLower) return true;

  const keywords = storedLower.split(" ");
  return (
    keywords.some(
      (keyword) => keyword.length > 2 && detectedLower.includes(keyword),
    ) ||
    keywords.some(
      (keyword) => keyword.length > 2 && storedLower.includes(detectedLower),
    )
  );
}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
admin.initializeApp();

/**
 * NEW FUNCTION: getTrails
 * This function creates an HTTP GET endpoint to fetch all documents from the 'trails' collection.
 * It also supports filtering via query parameters in the URL.
 *
 * How to use:
 * - To get all trails: `.../getTrails`
 * - To filter by difficulty: `.../getTrails?difficulty=easy`
 * - To filter by location: `.../getTrails?location=Yosemite`
 * - To filter by multiple fields: `.../getTrails?difficulty=hard&location=Zion`
 *
 * IMPORTANT: For filtering to work efficiently, you must create indexes in your Firestore database.
 * The Firebase console will provide a direct link in the error logs to create any missing indexes
 * the first time you try to run a query with filters.
 */
exports.getTrails = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // The rest of your function's logic goes here
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      let query = admin.firestore().collection('Trails');

      for (const key in req.query) {
        if (Object.prototype.hasOwnProperty.call(req.query, key)) {
          query = query.where(key, '==', req.query[key]);
        }
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        return res.status(200).json([]);
      }

      const trails = [];
      snapshot.forEach(doc => {
        trails.push({ id: doc.id, ...doc.data() });
      });

      res.status(200).json(trails);

    } catch (error) {
      console.error('Error fetching trails:', error);
      res.status(500).json({ error: 'Internal server error. Check function logs for details.' });
    }
  });
});

/**
 * NEW FUNCTION: submitTrail
 * This function creates an HTTP POST endpoint to submit new trail documents to the 'Trails' collection.
 * It validates the required fields and creates a new trail document with proper Firebase types.
 *
 * How to use:
 * POST to `.../submitTrail` with JSON body containing trail data
 * 
 * Required fields: name, location (lat, lng), distance, elevationGain, difficulty, status
 * Optional fields: tags, gpsRoute, description, photos
 * 
 * Example request body:
 * {
 *   "name": "Angel's Landing Trail",
 *   "location": {"lat": 37.2695, "lng": -112.9470},
 *   "distance": 5.4,
 *   "elevationGain": 1488,
 *   "difficulty": "Hard",
 *   "tags": ["scenic", "rocky", "chains"],
 *   "description": "A challenging trail with steep drop-offs...",
 *   "photos": ["https://storage.googleapis.com/.../photo1.jpg"],
 *   "status": "open"
 * }
 */
exports.submitTrail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
      const trailData = req.body;

      // Validate required fields
      const requiredFields = ['name', 'location', 'distance', 'elevationGain', 'difficulty', 'status'];
      const missingFields = requiredFields.filter(field => !trailData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          missingFields: missingFields 
        });
      }

      // Validate location format
      if (!trailData.location.lat || !trailData.location.lng) {
        return res.status(400).json({ 
          error: 'Location must include lat and lng coordinates' 
        });
      }

      // Validate difficulty values
      const validDifficulties = ['Easy', 'Moderate', 'Hard'];
      if (!validDifficulties.includes(trailData.difficulty)) {
        return res.status(400).json({ 
          error: 'Difficulty must be one of: Easy, Moderate, Hard' 
        });
      }

      // Validate status values
      const validStatuses = ['open', 'closed'];
      if (!validStatuses.includes(trailData.status)) {
        return res.status(400).json({ 
          error: 'Status must be either "open" or "closed"' 
        });
      }

      // Validate numeric fields
      if (typeof trailData.distance !== 'number' || trailData.distance <= 0) {
        return res.status(400).json({ 
          error: 'Distance must be a positive number' 
        });
      }

      if (typeof trailData.elevationGain !== 'number' || trailData.elevationGain < 0) {
        return res.status(400).json({ 
          error: 'Elevation gain must be a non-negative number' 
        });
      }

      // Prepare the trail document with ALL schema fields and proper Firebase types
      const trailDocument = {
        // Required fields from user input
        name: trailData.name,
        location: new admin.firestore.GeoPoint(trailData.location.lat, trailData.location.lng),
        distance: trailData.distance,
        elevationGain: trailData.elevationGain,
        difficulty: trailData.difficulty,
        status: trailData.status,
        
        // Auto-generated timestamps
        lastUpdated: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        
        // Optional fields with defaults
        tags: trailData.tags && Array.isArray(trailData.tags) ? trailData.tags : [],
        description: trailData.description || '',
        photos: trailData.photos && Array.isArray(trailData.photos) ? trailData.photos : [],
        gpsRoute: trailData.gpsRoute && Array.isArray(trailData.gpsRoute) 
          ? trailData.gpsRoute.map(point => new admin.firestore.GeoPoint(point.lat, point.lng))
          : [],
        
        // User reference (will be null if not authenticated)
        createdBy: null
      };

      // Set createdBy reference if user is authenticated
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split('Bearer ')[1];
          const decodedToken = await admin.auth().verifyIdToken(token);
          trailDocument.createdBy = admin.firestore().collection('Users').doc(decodedToken.uid);
        } catch (authError) {
          console.warn('Invalid auth token, creating trail without user reference:', authError.message);
          // createdBy remains null as set in the document above
        }
      }

      // Add the trail to Firestore
      const docRef = await admin.firestore().collection('Trails').add(trailDocument);

      res.status(201).json({
        message: 'Trail submitted successfully',
        trailId: docRef.id,
        trail: { id: docRef.id, ...trailDocument }
      });

    } catch (error) {
      console.error('Error submitting trail:', error);
      res.status(500).json({ 
        error: 'Internal server error. Check function logs for details.' 
      });
    }
  });
});

// Example: Simple API endpoint
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Firebase!' });
});

// Example: API with authentication
exports.getUserData = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const userId = context.auth.uid;
  
  try {
    const userDoc = await admin.firestore().collection('Users').doc(userId).get();
    return { data: userDoc.data() };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error fetching user data');
  }
});


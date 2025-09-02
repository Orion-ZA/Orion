const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
admin.initializeApp();
const db = admin.firestore();


/**
 * Helper references
 */
const getUserRef = (uid) => db.collection('Users').doc(uid);
const getTrailRef = (trailId) => admin.firestore().collection('Trails').doc(trailId);

/**
 * GET /alerts?trailId=TRAIL_ID
 * Fetch all active alerts for a specific trail
 */
exports.getTrailAlerts = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed. Use GET." });
    }

    const { trailId } = req.query;
    if (!trailId) {
      return res.status(400).json({ error: "trailId query parameter is required." });
    }

    try {
      console.log(`Fetching alerts for trailId: ${trailId}`);
      const snapshot = await admin.firestore().collection('Alerts')
        .where('trailId', '==', trailId)
        .where('isActive', '==', true)
        .orderBy('timestamp', 'desc')
        .get();

      console.log(`Found ${snapshot.size} alerts`);
      const alerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ alerts });
    } catch (err) {
      console.error("Error fetching trail alerts:", err);
      console.error("Error details:", err.message, err.stack);
      res.status(500).json({ 
        error: "Failed to fetch alerts.",
        details: err.message // Only include in development
      });
    }
  });
});

/**
 * POST /alerts
 * Add a new alert for a trail
 * Body: { trailId, message, type }
 */
/**
 * POST /alerts
 * Add a new alert for a trail
 * Body: { trailId, message, type }
 */
exports.addAlert = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send({ error: "Only POST requests are allowed." });
      }

      const { trailId, message, type } = req.body;

      if (!trailId || !message || !type) {
        return res.status(400).send({ error: "trailId, message, and type are required." });
      }

      // Create the alert with proper trail reference
      await db.collection("Alerts").add({
        trailId, 
        message,
        type,
        isActive: true, // Make sure to include isActive field
        timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use timestamp instead of createdAt
      });

      res.status(200).send({ success: true, message: "Alert added successfully" });
    } catch (err) {
      console.error("Error adding alert:", err);
      res.status(500).send({ error: "Internal server error" });
    }
  });
});

/**
 * Existing functions...
 */
exports.getTrails = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
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
      if (snapshot.empty) return res.status(200).json([]);

      const trails = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json(trails);

    } catch (error) {
      console.error('Error fetching trails:', error);
      res.status(500).json({ error: 'Internal server error. Check function logs for details.' });
    }
  });
});

exports.submitTrail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    try {
      const trailData = req.body;
      const requiredFields = ['name', 'location', 'distance', 'elevationGain', 'difficulty', 'status'];
      const missingFields = requiredFields.filter(field => !trailData[field]);
      if (missingFields.length > 0) return res.status(400).json({ error: 'Missing required fields', missingFields });

      if (!trailData.location.lat || !trailData.location.lng) return res.status(400).json({ error: 'Location must include lat and lng coordinates' });

      const validDifficulties = ['Easy', 'Moderate', 'Hard'];
      if (!validDifficulties.includes(trailData.difficulty)) return res.status(400).json({ error: 'Difficulty must be one of: Easy, Moderate, Hard' });

      const validStatuses = ['open', 'closed'];
      if (!validStatuses.includes(trailData.status)) return res.status(400).json({ error: 'Status must be either "open" or "closed"' });

      if (typeof trailData.distance !== 'number' || trailData.distance <= 0) return res.status(400).json({ error: 'Distance must be a positive number' });
      if (typeof trailData.elevationGain !== 'number' || trailData.elevationGain < 0) return res.status(400).json({ error: 'Elevation gain must be a non-negative number' });

      const trailDocument = {
        name: trailData.name,
        location: new admin.firestore.GeoPoint(trailData.location.lat, trailData.location.lng),
        distance: trailData.distance,
        elevationGain: trailData.elevationGain,
        difficulty: trailData.difficulty,
        status: trailData.status,
        lastUpdated: admin.firestore.Timestamp.now(),
        createdAt: admin.firestore.Timestamp.now(),
        tags: trailData.tags && Array.isArray(trailData.tags) ? trailData.tags : [],
        description: trailData.description || '',
        photos: trailData.photos && Array.isArray(trailData.photos) ? trailData.photos : [],
        gpsRoute: trailData.gpsRoute && Array.isArray(trailData.gpsRoute) ? trailData.gpsRoute.map(point => new admin.firestore.GeoPoint(point.lat, point.lng)) : [],
        createdBy: null
      };

      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split('Bearer ')[1];
          const decodedToken = await admin.auth().verifyIdToken(token);
          trailDocument.createdBy = admin.firestore().collection('Users').doc(decodedToken.uid);
        } catch (authError) {
          console.warn('Invalid auth token, creating trail without user reference:', authError.message);
        }
      }

      const docRef = await admin.firestore().collection('Trails').add(trailDocument);
      res.status(201).json({ message: 'Trail submitted successfully', trailId: docRef.id, trail: { id: docRef.id, ...trailDocument } });

    } catch (error) {
      console.error('Error submitting trail:', error);
      res.status(500).json({ error: 'Internal server error. Check function logs for details.' });
    }
  });
});

/**
 * POST /favourites/add
 * Add a trail to user's favourites
 * Body: { uid, trailId }
 */
exports.addFavourite = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { uid, trailId } = req.body;
    if (!uid || !trailId) return res.status(400).json({ error: 'uid and trailId are required.' });

    try {
      const userRef = getUserRef(uid);
      await userRef.update({
        favourites: admin.firestore.FieldValue.arrayUnion(getTrailRef(trailId))
      });
      res.status(200).json({ message: 'Trail added to favourites.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add trail to favourites.' });
    }
  });
});

/**
 * POST /favourites/remove
 * Remove a trail from user's favourites
 * Body: { uid, trailId }
 */
exports.removeFavourite = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { uid, trailId } = req.body;
    if (!uid || !trailId) return res.status(400).json({ error: 'uid and trailId are required.' });

    try {
      const userRef = getUserRef(uid);
      await userRef.update({
        favourites: admin.firestore.FieldValue.arrayRemove(getTrailRef(trailId))
      });
      res.status(200).json({ message: 'Trail removed from favourites.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove trail from favourites.' });
    }
  });
});

/**
 * POST /completed
 * Mark a trail as completed
 * Body: { uid, trailId }
 */
exports.markCompleted = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { uid, trailId } = req.body;
    if (!uid || !trailId) return res.status(400).json({ error: 'uid and trailId are required.' });

    try {
      const userRef = getUserRef(uid);
      await userRef.update({
        completed: admin.firestore.FieldValue.arrayUnion(getTrailRef(trailId)),
        favourites: admin.firestore.FieldValue.arrayRemove(getTrailRef(trailId)),
        wishlist: admin.firestore.FieldValue.arrayRemove(getTrailRef(trailId))
      });
      res.status(200).json({ message: 'Trail marked as completed.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to mark trail as completed.' });
    }
  });
});

/**
 * POST /wishlist/add
 * Add a trail to wishlist
 * Body: { uid, trailId }
 */
exports.addWishlist = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { uid, trailId } = req.body;
    if (!uid || !trailId) return res.status(400).json({ error: 'uid and trailId are required.' });

    try {
      const userRef = getUserRef(uid);
      await userRef.update({
        wishlist: admin.firestore.FieldValue.arrayUnion(getTrailRef(trailId))
      });
      res.status(200).json({ message: 'Trail added to wishlist.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add trail to wishlist.' });
    }
  });
});

/**
 * POST /wishlist/remove
 * Remove a trail from wishlist
 * Body: { uid, trailId }
 */
exports.removeWishlist = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { uid, trailId } = req.body;
    if (!uid || !trailId) return res.status(400).json({ error: 'uid and trailId are required.' });

    try {
      const userRef = getUserRef(uid);
      await userRef.update({
        wishlist: admin.firestore.FieldValue.arrayRemove(getTrailRef(trailId))
      });
      res.status(200).json({ message: 'Trail removed from wishlist.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove trail from wishlist.' });
    }
  });
});

/**
 * GET /savedTrails?uid=USER_ID
 * Get all saved trails for a user grouped by favourites, wishlist, completed
 */
exports.getSavedTrails = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });

    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required.' });

    try {
      const userDoc = await getUserRef(uid).get();
      if (!userDoc.exists) return res.status(404).json({ error: 'User not found.' });

      const data = userDoc.data();

      // Resolve trail references to actual trail data
      const resolveTrails = async (refs) => {
        if (!refs || refs.length === 0) return [];
        const snapshots = await Promise.all(refs.map(ref => ref.get()));
        return snapshots.filter(s => s.exists).map(s => ({ id: s.id, ...s.data() }));
      };

      const favourites = await resolveTrails(data.favourites || []);
      const wishlist = await resolveTrails(data.wishlist || []);
      const completed = await resolveTrails(data.completed || []);

      res.status(200).json({ favourites, wishlist, completed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch saved trails.' });
    }
  });
});

/**
 * POST /completed/remove
 * Remove a trail from user's completed list
 * Body: { uid, trailId }
 */
exports.removeCompleted = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { uid, trailId } = req.body;
    if (!uid || !trailId) return res.status(400).json({ error: 'uid and trailId are required.' });

    try {
      const userRef = getUserRef(uid);
      await userRef.update({
        completed: admin.firestore.FieldValue.arrayRemove(getTrailRef(trailId))
      });
      res.status(200).json({ message: 'Trail removed from completed.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove trail from completed.' });
    }
  });
});

/**
 * POST /trails/update
 * Update trail info
 * Body: { trailId, updates }
 * updates = { name, distance, elevationGain, difficulty, status, description, tags, gpsRoute }
 */
exports.updateTrailInfo = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    const { trailId, updates } = req.body;
    if (!trailId || !updates) {
      return res.status(400).json({ error: 'trailId and updates are required.' });
    }

    try {
      const trailRef = getTrailRef(trailId);
      const validFields = ['name', 'distance', 'elevationGain', 'difficulty', 'status', 'description', 'tags', 'gpsRoute', 'reviews'];
      const dataToUpdate = {};

      validFields.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'gpsRoute' && Array.isArray(updates[field])) {
            dataToUpdate.gpsRoute = updates[field].map(point => new admin.firestore.GeoPoint(point.lat, point.lng));
          } else if (field === 'reviews' && Array.isArray(updates[field])) {
            // Reviews will be added using arrayUnion
            dataToUpdate.reviews = admin.firestore.FieldValue.arrayUnion(...updates.reviews);
          } else {
            dataToUpdate[field] = updates[field];
          }
        }
      });

      // Always update lastUpdated timestamp
      dataToUpdate.lastUpdated = admin.firestore.Timestamp.now();

      await trailRef.update(dataToUpdate);

      res.status(200).json({ message: 'Trail info updated successfully.' });
    } catch (err) {
      console.error('Error updating trail info:', err);
      res.status(500).json({ error: 'Failed to update trail info.' });
    }
  });
});

/**
 * POST /trails/updateImages
 * Update trail images
 * Body: { trailId, photos }
 */
exports.updateTrailImages = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { trailId, photos } = req.body;
    if (!trailId || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'trailId and photos array are required.' });
    }

    try {
      const trailRef = getTrailRef(trailId);
      await trailRef.update({
        photos: admin.firestore.FieldValue.arrayUnion(...photos),
        lastUpdated: admin.firestore.Timestamp.now()
      });
      res.status(200).json({ message: 'Trail images updated successfully.' });
    } catch (err) {
      console.error('Error updating trail images:', err);
      res.status(500).json({ error: 'Failed to update trail images.' });
    }
  });
});

/**
 * GET /getTrailReviews?trailId=TRAIL_ID
 * Fetch all reviews for a specific trail
 */
exports.getTrailReviews = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed. Use GET." });
    }

    const { trailId } = req.query;
    if (!trailId) {
      return res.status(400).json({ error: "trailId query parameter is required." });
    }

    try {
      const reviewsSnapshot = await getTrailRef(trailId)
        .collection("reviews")
        .orderBy("timestamp", "desc")
        .get();

      const reviews = reviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ reviews });
    } catch (err) {
      console.error("Error fetching trail reviews:", err);
      res.status(500).json({ error: "Failed to fetch reviews." });
    }
  });
});

exports.addTrailReview = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });

    const { trailId, review } = req.body;
    if (!trailId || !review) return res.status(400).json({ error: 'trailId and review are required.' });

    try {
      const trailRef = getTrailRef(trailId);
      const reviewRef = trailRef.collection('reviews').doc(review.id);
      await reviewRef.set(review);
      res.status(200).json({ message: 'Review added successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add review.' });
    }
  });
});


exports.helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Firebase!' });
});

exports.getUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');

  try {
    const userDoc = await admin.firestore().collection('Users').doc(context.auth.uid).get();
    return { data: userDoc.data() };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error fetching user data');
  }
});

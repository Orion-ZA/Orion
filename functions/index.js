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
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    return { data: userDoc.data() };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Error fetching user data');
  }
});


const functions = require('firebase-functions');
const admin = require('firebase-admin');
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
exports.getTrails = functions.https.onRequest(async (req, res) => {
  // Set CORS headers to allow requests from your web app
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Handle pre-flight requests for CORS
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // We only want to handle GET requests for this endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Start with a base query pointing to the 'Trails' collection
    let query = admin.firestore().collection('Trails');

    // Dynamically build the query based on URL parameters
    // This allows filtering for any field present in your documents.
    // Example: checks for 'difficulty', 'location', 'length_km', etc.
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        query = query.where(key, '==', req.query[key]);
      }
    }

    const snapshot = await query.get();

    // If no documents are found, return an empty array
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    // Map the documents to an array of objects, including the document ID
    const trails = [];
    snapshot.forEach(doc => {
      trails.push({ id: doc.id, ...doc.data() });
    });

    // Send the array of trails as a JSON response
    res.status(200).json(trails);

  } catch (error) {
    console.error('Error fetching trails:', error);
    res.status(500).json({ error: 'Internal server error. Check function logs for details.' });
  }
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


const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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

// Example: REST API endpoint
exports.createItem = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { name, description } = req.body;
    const docRef = await admin.firestore().collection('items').add({
      name,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({ id: docRef.id, message: 'Item created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
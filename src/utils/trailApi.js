import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

// Trail data fetching
export const fetchTrailData = async trailId => {
  const trailDoc = await getDoc(doc(db, 'Trails', trailId));
  if (trailDoc.exists()) {
    return { id: trailDoc.id, ...trailDoc.data() };
  }
  throw new Error('Trail not found');
};

// User trail actions (favorites, wishlist, completed)
export const updateUserTrailAction = async (userId, action, trailId, currentArray) => {
  const userRef = doc(db, 'Users', userId);
  const trailRef = doc(db, 'Trails', trailId);
  const isInArray = currentArray.includes(trailId);

  if (isInArray) {
    await updateDoc(userRef, {
      [action]: arrayRemove(trailRef),
    });
    return { action: 'remove', trailId };
  } else {
    await updateDoc(userRef, {
      [action]: arrayUnion(trailRef),
    });
    return { action: 'add', trailId };
  }
};

// Reviews API calls
export const fetchTrailReviews = async trailId => {
  const response = await fetch(
    `https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=${trailId}`
  );

  if (response.ok) {
    const data = await response.json();
    return data.reviews || [];
  }
  throw new Error('Failed to fetch reviews');
};

export const addTrailReview = async (trailId, reviewData) => {
  const response = await fetch('https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trailId: trailId,
      review: {
        id: uuidv4(),
        ...reviewData,
        timestamp: new Date().toISOString(),
      },
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);
  return result;
};

// Image upload
export const uploadTrailImages = async (trailId, images) => {
  const uploadPromises = images.map(async image => {
    const imageRef = ref(storage, `trail-images/${trailId}/${uuidv4()}`);
    await uploadBytes(imageRef, image);
    return await getDownloadURL(imageRef);
  });
  return Promise.all(uploadPromises);
};

export const updateTrailImages = async (trailId, photos) => {
  const response = await fetch(
    'https://us-central1-orion-sdp.cloudfunctions.net/updateTrailImages',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trailId: trailId,
        photos: photos,
      }),
    }
  );

  if (!response.ok) throw new Error('Failed to update trail images');
  return response.json();
};

// Alerts
export const addTrailAlert = async alertData => {
  const firestoreAlertData = {
    ...alertData,
    isActive: true,
    timestamp: serverTimestamp(),
  };

  if (alertData.isTimed && alertData.duration) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + alertData.duration * 60 * 1000);
    firestoreAlertData.expiresAt = expiresAt;
    firestoreAlertData.isTimed = true;
  }

  const docRef = await addDoc(collection(db, 'Alerts'), firestoreAlertData);
  return docRef.id;
};

// Reports
export const submitTrailReport = async reportData => {
  const reportDoc = {
    ...reportData,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'Reports'), reportDoc);
  return docRef.id;
};

// Weather API
export const fetchWeatherData = async (latitude, longitude) => {
  const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || '824bc28d7c314a9f031ecbe01823dbb8';

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
  );

  if (response.ok) {
    const data = await response.json();
    return processWeatherData(data);
  } else {
    // Fallback to current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
    );

    if (currentResponse.ok) {
      const currentData = await currentResponse.json();
      return [
        {
          date: new Date().toDateString(),
          minTemp: Math.round(currentData.main.temp_min),
          maxTemp: Math.round(currentData.main.temp_max),
          condition: currentData.weather[0].main,
          humidity: currentData.main.humidity,
          windSpeed: Math.round(currentData.wind.speed),
        },
      ];
    }
    throw new Error('Failed to fetch weather data');
  }
};

const processWeatherData = data => {
  const dailyForecasts = {};

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();

    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        date,
        temps: [],
        conditions: [],
        humidity: [],
        windSpeed: [],
      };
    }

    dailyForecasts[date].temps.push(item.main.temp);
    dailyForecasts[date].conditions.push(item.weather[0].main);
    dailyForecasts[date].humidity.push(item.main.humidity);
    dailyForecasts[date].windSpeed.push(item.wind.speed);
  });

  return Object.values(dailyForecasts)
    .slice(0, 7)
    .map(day => ({
      date: day.date,
      minTemp: Math.min(...day.temps),
      maxTemp: Math.max(...day.temps),
      condition: day.conditions[0],
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
    }));
};

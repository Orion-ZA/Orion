import { useState, useEffect } from "react";
import { db } from '../../firebaseConfig';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function useFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeedbacks(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { feedbacks, loading };
}

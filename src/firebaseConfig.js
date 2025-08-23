import {initializeApp} from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBbeISEUfpjyrUSOGoLJuXv-xDWB1c1GMQ",
    authDomain: "orion-sdp.firebaseapp.com",
    projectId: "orion-sdp",
    storageBucket: "orion-sdp.firebasestorage.app",
    messagingSenderId: "707988253653",
    appId: "1:707988253653:web:dfce6814839b345403ab5c"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {db, auth, googleProvider};
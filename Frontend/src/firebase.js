import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCqgNFSoG2hgGJLbg1ZKzMo8ZGhwZjnTOE",
  authDomain: "srisaravanashoppings-df810.firebaseapp.com",
  projectId: "srisaravanashoppings-df810",
  storageBucket: "srisaravanashoppings-df810.appspot.com",
  messagingSenderId: "399734722761",
  appId: "1:399734722761:web:5f5c7c6c6b9eec4c517d18"
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false, 
});

const auth = getAuth(app);

export const storage = getStorage(app);

// Realtime Database (for storing small data / in this case data URLs)
export const rdb = getDatabase(app);

export { app, db, auth };
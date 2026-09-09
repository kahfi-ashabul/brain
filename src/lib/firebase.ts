import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAjkupiEXR4Din-gXB8SXU2-IUW6OhSDSQ',
  authDomain: 'kei-cognitive.firebaseapp.com',
  projectId: 'kei-cognitive',
  storageBucket: 'kei-cognitive.firebasestorage.app',
  messagingSenderId: '1016187705360',
  appId: '1:1016187705360:web:e00f1e4744fac695879295',
  measurementId: 'G-KVET4FW9QX',
  databaseURL: 'https://kei-cognitive-default-rtdb.firebaseio.com/',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export let firebaseOnline = true;

const connectedRef = ref(db, '.info/connected');
onValue(connectedRef, (snap) => {
  firebaseOnline = snap.val() === true;
});

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNpsxlawK7T57MvFKM4VDpBI94xuu_3NA",
  authDomain: "buzzer-app-3e039.firebaseapp.com",
  databaseURL: "https://buzzer-app-3e039-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "buzzer-app-3e039",
  storageBucket: "buzzer-app-3e039.firebasestorage.app",
  messagingSenderId: "323000208608",
  appId: "1:323000208608:web:c3aa34bef15998affad485"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app)
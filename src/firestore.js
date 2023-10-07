// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB999jHbkRaTWSHp0HjzmmbkokyzGwKsiM",
  authDomain: "lifr-e0d67.firebaseapp.com",
  projectId: "lifr-e0d67",
  storageBucket: "lifr-e0d67.appspot.com",
  messagingSenderId: "195095929706",
  appId: "1:195095929706:web:202fc2ba5ac22648abbb13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)
export const projectID = firebaseConfig.projectId
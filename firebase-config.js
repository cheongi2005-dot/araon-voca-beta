// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBX884NnG9CxLSa72C0lvKhSGgmONFhSi8",
  authDomain: "vocaraon.firebaseapp.com",
  projectId: "vocaraon",
  storageBucket: "vocaraon.firebasestorage.app",
  messagingSenderId: "308326880420",
  appId: "1:308326880420:web:44df6138df2111a012c231",
  measurementId: "G-M9ZJPEJFFW"
};

// 파이어베이스 시작!
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
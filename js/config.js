// ============================================================
//  1) Paste your Firebase web config here (Firebase console →
//     Project settings → General → Your apps → Web app → Config)
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyBVQdks4_08-fZbvXY0iuSJLFtgRv6P-ag",
  authDomain: "nlc-game.firebaseapp.com",
  databaseURL: "https://nlc-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nlc-game",
  storageBucket: "nlc-game.firebasestorage.app",
  messagingSenderId: "267631199296",
  appId: "1:267631199296:web:37c7c820b8ca56c6198ba5"
};

// ============================================================
//  2) Your game branding
// ============================================================
export const GAME = {
  title: "Team Challenge",
  titleAr: "تحدي الفرق",
  // Files inside the /assets folder. Replace them with your own.
  logo: "assets/logo.png",
  background: "assets/background.jpg", // leave the file missing to use the gradient
  // Link shown (and turned into a QR code) on the projector lobby.
  // Leave empty to use this site's own address automatically.
  playerUrl: ""
};

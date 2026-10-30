// =============================================================================
// إعدادات Firebase الخاصة بموقع عمار للتعريب
// =============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBfd1cvHrQzFmugdEqTJljdLFlcpRW4PCo",
  authDomain: "ammar-taareb.firebaseapp.com",
  projectId: "ammar-taareb",
  storageBucket: "ammar-taareb.firebasestorage.app",
  messagingSenderId: "196683942441",
  appId: "1:196683942441:web:661c52b42e9e8f62b76a38"
};

// فحص هل إعدادات Firebase مهيأة
window.isFirebaseConfigured = function() {
  return Boolean(
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("PUT_YOUR_") &&
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("PUT_YOUR_")
  );
};

// تهيئة خدمات Firebase
window.db = null;
window.auth = null;

if (typeof firebase !== 'undefined' && firebase.initializeApp) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (typeof firebase.firestore === 'function') {
      window.db = firebase.firestore();
    }
    if (typeof firebase.auth === 'function') {
      window.auth = firebase.auth();
    }
  } catch (e) {
    console.warn("تعذر تهيئة Firebase حالياً:", e);
  }
}

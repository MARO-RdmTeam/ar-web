// =============================================================================
// إعدادات Firebase الخاصة بموقع عمار للتعريب
// =============================================================================
// للحصول على هذه المفاتيح مجاناً:
// 1. افتح https://console.firebase.google.com/ وسجل دخولك بحساب Google.
// 2. أنشئ مشروعاً جديداً (مثلاً: ammar-taareeb).
// 3. اضغط على أيقونة الويب (</>) لإضافة تطبيق ويب، وانسخ كائن firebaseConfig وضعه هنا.
// 4. من القائمة الجانبية:
//    - فعل Authentication واختر Email/Password ثم أضف حسابك وكلمة سرك.
//    - فعل Cloud Firestore وأنشئ قاعدة بيانات في وضع الإنتاج.
// =============================================================================

const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY_HERE",
  authDomain: "PUT_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PUT_YOUR_PROJECT_ID_HERE",
  storageBucket: "PUT_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PUT_YOUR_APP_ID_HERE"
};

// فحص هل قام صاحب الموقع بوضع مفاتيحه الحقيقية
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


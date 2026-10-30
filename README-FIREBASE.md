# دليل إعداد Firebase لموقع عمار للتعريب 🔥

تم تحويل الموقع بالكامل إلى **Firebase** ليعمل بنظام قاعدة بيانات سحابية حقيقية (`Cloud Firestore`) مع نظام تسجيل دخول وتوثيق محمي ومشفر بالكامل (`Firebase Authentication`).

---

## الخطوات البسيطة لتفعيل الموقع (تستغرق 3 دقائق فقط):

### 1. إنشاء مشروع Firebase مجاني
1. ادخل إلى [Firebase Console](https://console.firebase.google.com/) وسجل بحساب Google.
2. اضغط **Add project** (إضافة مشروع)، وسمّه ما تشاء (مثلاً: `ammar-taareeb`).
3. عطل Google Analytics (غير ضروري) ثم اضغط **Create project**.

---

### 2. تفعيل تسجيل الدخول (Authentication)
1. من القائمة الجانبية في Firebase Console، اختر **Build** ثم **Authentication**.
2. اضغط **Get started**.
3. في تبويب **Sign-in method**، اختر **Email/Password**، وقم بتفعيل الخيار الأول (Enable) ثم اضغط **Save**.
4. انتقل إلى تبويب **Users** واضغط **Add user**:
   - ضع بريدك الإلكتروني (مثلاً: `admin@ammar.com`).
   - اختر كلمة مرور قوية واحتفظ بها.

---

### 3. تفعيل قاعدة البيانات (Cloud Firestore) وقواعد الحماية
1. من القائمة الجانبية، اختر **Build** ثم **Firestore Database**.
2. اضغط **Create database**، اختر مكان السيرفر (مثلاً `eur3` أو الأقرب لك)، ثم اختر **Start in production mode**.
3. بعد إنشاء القاعدة، اذهب إلى تبويب **Rules** (القواعد) والصق القواعد التالية ثم اضغط **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // إعدادات الموقع: تصفح للجميع، وتعديل فقط لحسابك الإداري المسجل
    match /settings/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // الألعاب المعربة: تصفح للجميع، وإضافة/تعديل/حذف فقط لحسابك الإداري
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
  }
}
```

---

### 4. نسخ مفاتيح الربط إلى ملف `firebase-config.js`
1. من القائمة الجانبية، اضغط على أيقونة الترس ⚙️ بجانب **Project Overview** ثم اختر **Project settings**.
2. في أسفل الصفحة عند قسم **Your apps**، اضغط على أيقونة الويب `</>`.
3. اكتب اسماً للتطبيق (مثلاً `web`) ثم اضغط **Register app**.
4. ستظهر لك شفرة تحتوي على `const firebaseConfig = { ... }`.
5. افتح ملف `firebase-config.js` في مجلد موقعك، والصق القيم داخل `firebaseConfig`.

---

### 5. ترحيل بياناتك القديمة (بضغطة زر واحدة!)
1. افتح صفحة الإدارة `admin.html`.
2. سجّل دخولك بالبريد وكلمة المرور اللذين أنشأتهما في الخطوة 2.
3. ستفتح لك لوحة الإدارة؛ اضغط على زر **«ترحيل data.json إلى Firebase»** الموجود في الشريط العلوي.
4. سيتم رفع جميع الألعاب والإعدادات إلى قاعدة البيانات فوراً، وستظهر لجميع زوار موقعك في ثانية واحدة!


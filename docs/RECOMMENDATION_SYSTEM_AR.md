# نظام التوصية في NorthFall — شرح للمطورين (Gemini / Cursor)

## الهدف
فهم ذوق المستخدم واقتراح **مجتمعات** في الشريط الجانبي و**ألعاب** في `/games`.

---

## 1. تخزين الاهتمامات — `users/{uid}.userInterests`

مصفوفة نصوص موحّدة (slugs)، مثل:
`["gamedev", "gaming", "programming"]`

**الحد الأقصى:** 48 عنصراً في المستخدم، 10 عناصر في استعلام Firestore `array-contains-any`.

### ثلاث طرق للجمع

| الطريقة | متى | الملف |
|--------|-----|-------|
| **صريح (Explicit)** | المستخدم يختار تصنيفاً في خطوة «عن ماذا سيكون مجتمعك؟» ويضغط «التالي» | `CreateCommunityPage.tsx` → `saveExplicitInterestsFromCategory()` |
| **ضمني (Implicit)** | زيارة مجتمع أو تمرير الماوس على كرت لعبة **مرتين** (يُحفظ العد في `localStorage`) | `lib/implicit-interest.ts` |
| **اشتراك (Subscription)** | انضمام لمجتمع (زر / نقرة على الصف في الشريط) | `CommunityPage`, `SidebarRight` → `saveSubscriptionInterests()` |

الدوال الأساسية في `lib/user-interests.ts`:
- `addUserInterests(uid, tags)` — دمج بدون تكرار
- `interestTagsFromCategory(category)` — من تصنيف المجتمع
- `interestTagsFromCommunityData(doc)` — تصنيف + `tags[]`
- `interestTagsFromGameGenres(genre[])` — من أنواع اللعبة

---

## 2. وسوم المجتمعات — `communities/{id}.tags`

حقل **`tags`** مصفوفة **نصوص** (strings) تُستخدم في:
```js
where("tags", "array-contains-any", userInterests.slice(0, 10))
```

تُملأ عند:
- إنشاء مجتمع: `buildCommunityTagsField(category)` في `CreateCommunityPage`
- تعديل مجتمع: `EditCommunityPage` (نفس الدالة)

المجتمعات القديمة قد لا تحتوي `tags` صالحة → يعمل **fallback** من الكاش المحلي.

---

## 3. الشريط الجانبي — قسمان

| القسم | المفتاح i18n | المنطق |
|-------|-------------|--------|
| **مجتمعات مقترحة** | `sr.displayComms` | `resolveRecommendedCommunityIds()` — Firestore ثم مطابقة تصنيف ثم شعبية |
| **مجتمعات رهيبة** | `sr.trending` | `popularCommunityIds()` — الأكثر `memberCount` |

**ملف العرض:** `app/components/SidebarRight.tsx`  
**ملف الاستعلام:** `lib/recommendations.ts`

### سلوك «رهيبة» (مهم)
- ترتيب حسب عدد الأعضاء (`members` / `memberCount`).
- إذا بقي **أقل من مجتمعين** بعد استبعاد المقترحة (مثلاً عندك فقط Unity3D و UnityTest)، يُعرض القسم من **كل المجتمعات** حتى لو تكرر مع المقترحة — وإلا القسم يختفي.

### النقر على صف مجتمع
1. إن لم يكن منضماً → `joinCommunity()` (Firestore members + user/communities)
2. `saveSubscriptionInterests()` عند الانضمام
3. `onCommunityClick(id)` — فتح صفحة المجتمع

لا يظهر زر «عضو» — يظهر **انضمام** فقط لغير المنضمين.

---

## 4. صفحة الألعاب `/games`

الألعاب **ليست** في Firestore — كتالوج ثابت `GAMES` في `GamesPage.tsx`.

- قراءة `userInterests` من `users/{uid}` (snapshot في `NorthfallGamesPage`).
- التصفية: `recommendGames(interests)` في `lib/recommendations.ts` — تقاطع `interestTagsFromGameGenres` مع اهتمامات المستخدم.
- قسم **«مقترح لك»** أعلى الصفحة.
- تمرير الماوس على كرت لعبة مرتين → `trackImplicitInterest("game", ...)`.

---

## 5. تدفق البيانات (مختصر)

```
[إنشاء مجتمع / زيارة / انضمام / لعبة]
        ↓
  addUserInterests → users/{uid}.userInterests
        ↓
  Sidebar: array-contains-any على communities.tags
        ↓
  مقترحة (شخصية) + رهيبة (شعبية)
```

---

## 6. ملفات المشروع

| ملف | الدور |
|-----|------|
| `lib/user-interests.ts` | جمع ودمج الاهتمامات، بناء tags للمجتمعات |
| `lib/implicit-interest.ts` | عدّاد زيارات محلي (2+) |
| `lib/recommendations.ts` | استعلام Firestore + fallback + ألعاب |
| `app/components/DataProvider.tsx` | `userInterests` live من Firestore |
| `app/components/SidebarRight.tsx` | واجهة القسمين + انضمام ودخول |
| `firestore.rules` | `validUserInterestsField`, `validCommunityTagsField` |

---

## 7. أسباب شائعة لقسم فارغ

1. **مجتمعات قليلة** (2 فقط) وكلها في «مقترحة» — كان يُستبعد الباقي؛ تم إصلاح «رهيبة» لإظهار الكل عند الحاجة.
2. **`showInForum: false`** — لا يظهر في `DataProvider`.
3. **أسماء مستبعدة:** `unity`, `unreal`, `godot`, `blender` (حرفياً، ليس Unity3D).
4. **المستخدم منضم للكل** — المقترحة تفضّل غير المنضم؛ الرهيبة تعرض الأكثر شعباً مع fallback.

---

## 8. نشر

```bash
firebase deploy --only firestore:rules
```

فهرس `array-contains-any` على `communities.tags` عادة لا يحتاج index مركب إذا كان الشرط وحيداً.

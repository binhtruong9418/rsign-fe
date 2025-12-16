# SigningPageV2 - UI Matching with V2 API

**Date:** 2025-12-16  
**Goal:** Keep same UI/UX as old SignDocumentPage but use V2 session-based API

---

## ✅ What Changed

### **Same UI Components**

- ✅ Header with logo
- ✅ Two-view system: Document Review → Signature
- ✅ Same layout and styling
- ✅ Mobile-optimized signature pad (square, centered)
- ✅ Desktop full-screen signature area
- ✅ Same button positions and styles
- ✅ Body scroll lock when signing

### **New V2 Features Added**

- ✅ **Session Timer** - Shows countdown in both views
- ✅ **Session Validation** - Checks device fingerprint
- ✅ **Cancel Session** - On back button and beforeunload
- ✅ **Idempotency** - Prevents double submission
- ✅ **Error Handling** - Structured error codes with specific actions

---

## 🎨 UI Structure

### **Document Review View**

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Session Timer: ⏱️ 28:45             │
├─────────────────────────────────────┤
│ Review: Document Title     [Back]   │
│ Please review before signing        │
├─────────────────────────────────────┤
│                                     │
│     PDF/Document Viewer             │
│     (with zoom controls)            │
│                                     │
├─────────────────────────────────────┤
│   [Proceed to Sign]                 │
└─────────────────────────────────────┘
```

### **Signature View**

```
┌─────────────────────────────────────┐
│ [← Back]              ⏱️ 28:45      │
│                                     │
│                                     │
│     ┌─────────────────┐             │
│     │                 │             │
│     │  Signature Pad  │             │
│     │                 │             │
│     └─────────────────┘             │
│        Sign above                   │
│                                     │
├─────────────────────────────────────┤
│  [Clear]          [Sign]            │
└─────────────────────────────────────┘
```

---

## 🔄 API Flow Comparison

### **Old (V1)**

```typescript
// Direct sign with sessionId
POST /documents/sign/:sessionId
{
  strokes: [...],
  color: "#000000",
  width: 2
}
```

### **New (V2)**

```typescript
// 1. Load session (validates device)
GET /documents/sessions/:sessionId
→ Returns: { session, document, canSign }

// 2. Submit signature with idempotency
POST /documents/sessions/:sessionId/sign
{
  signatureData: {
    strokes: [...],
    color: "#000000",
    width: 2
  },
  idempotencyKey: "uuid"
}

// 3. Cancel session (optional)
DELETE /documents/sessions/:sessionId/cancel
```

---

## 📝 Key Implementation Details

### **1. Session Timer Integration**

```typescript
// In Document View - Top bar
<div className="bg-white border-b">
  <SessionTimer expiresAt={session.expiresAt} onExpired={handleSessionExpired} />
</div>

// In Signature View - Floating top-right
<div className="absolute top-4 right-4">
  <SessionTimer expiresAt={session.expiresAt} onExpired={handleSessionExpired} />
</div>
```

### **2. Signature Data Conversion**

```typescript
// Convert SignaturePad format to V2 Stroke format
const strokesData = signaturePadRef.current?.getSignature();
const strokes: Stroke[] = strokesData.map((stroke, idx) => ({
  id: `stroke-${idx}`,
  points: stroke.map((point: any) => ({
    x: point.x,
    y: point.y,
    timestamp: point.time || Date.now(),
  })),
}));
```

### **3. Cancel Session Handlers**

```typescript
// On back button from document view
const handleBack = () => {
  if (view === "sign") {
    setView("document"); // Just go back to review
  } else {
    setShowCancelConfirm(true); // Confirm before canceling session
  }
};

// On browser close/refresh
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    navigator.sendBeacon(`${apiUrl}/documents/sessions/${sessionId}/cancel`);
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [sessionId]);
```

### **4. Error Handling**

```typescript
handleSigningError(err, {
  onSessionExpired: () => {
    showToast.error("Session expired");
    navigate("/dashboard");
  },
  onSigningInProgress: () => {
    showToast.info("Retrying...");
    setTimeout(() => handleSubmitSignature(), 1000);
  },
  onTooManyAttempts: () => {
    showToast.error("Too many attempts");
    navigate("/dashboard");
  },
  onDefault: (message) => {
    showToast.error(message);
  },
});
```

---

## 🎯 Features Comparison

| Feature                 | Old (V1)                | New (V2)                              |
| ----------------------- | ----------------------- | ------------------------------------- |
| **UI Layout**           | ✅ Two-view system      | ✅ Same                               |
| **Mobile Optimization** | ✅ Square signature pad | ✅ Same                               |
| **Header**              | ✅ With logo            | ✅ Same                               |
| **Session Timer**       | ❌ No timer             | ✅ **NEW** - Countdown with colors    |
| **Device Lock**         | ❌ No validation        | ✅ **NEW** - Device fingerprint       |
| **Cancel Session**      | ❌ No cancel            | ✅ **NEW** - Release lock immediately |
| **Idempotency**         | ❌ No protection        | ✅ **NEW** - Prevents double-sign     |
| **Error Handling**      | ⚠️ Generic              | ✅ **NEW** - 12 specific error codes  |
| **Session Expiry**      | ❌ No expiry            | ✅ **NEW** - 30-minute TTL            |
| **Success Page**        | ⚠️ Basic                | ✅ **NEW** - With confetti & status   |

---

## 📱 Responsive Behavior

### **Mobile (< 768px)**

- Square signature pad (400x400px max)
- Centered on screen
- "Sign above" helper text
- Full-width buttons
- Sticky bottom button bar

### **Desktop (≥ 768px)**

- Full-screen signature area
- No helper text
- Side-by-side buttons
- Floating back button (top-left)
- Floating timer (top-right)

---

## 🧪 Testing Checklist

- [ ] Document review loads correctly
- [ ] PDF viewer works (zoom, scroll)
- [ ] "Proceed to Sign" navigates to signature view
- [ ] Back button from signature returns to document
- [ ] Back button from document shows cancel confirm
- [ ] Session timer counts down correctly
- [ ] Timer shows warning when < 5 minutes
- [ ] Session expires after 30 minutes
- [ ] Signature pad works on mobile (touch)
- [ ] Signature pad works on desktop (mouse)
- [ ] Clear button clears signature
- [ ] Sign button submits successfully
- [ ] Idempotency prevents double-sign
- [ ] Cancel session on browser close (beacon)
- [ ] Success page shows correct status
- [ ] All error codes handled properly

---

## 🎨 Styling Notes

### **Colors**

- Green timer: > 5 minutes
- Yellow timer: 1-5 minutes
- Red timer: < 1 minute (with pulse animation)

### **Transitions**

- View switching: 300ms duration
- Button hover: smooth color transition
- Modal fade-in: backdrop blur

### **Shadows**

- Mobile buttons: `shadow-lg`
- Desktop buttons: `shadow-sm`
- Signature pad mobile: `shadow-sm`
- Main container: `shadow-xl`

---

## 📦 Dependencies Used

- `SignaturePad` - Existing component
- `DocumentContentViewer` - Existing component
- `Header` - Existing component
- `SessionTimer` - **NEW** V2 component
- `useBodyScrollLock` - Existing hook
- `signingApi` - **NEW** V2 API service
- `handleSigningError` - **NEW** V2 error handler
- `showToast` - Existing toast utility

---

**Status:** ✅ Complete - Same UI, V2 API, Enhanced Features

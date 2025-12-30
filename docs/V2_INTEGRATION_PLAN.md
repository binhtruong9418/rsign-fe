# RSign Frontend V2 Integration Plan

**Branch:** `beta/v2`  
**Status:** Planning  
**Last Updated:** 2025-12-15

---

## 📋 Overview

Integrate new V2 signing workflow with:

- Checkout session pattern (device-locked)
- Session-based signing (30-minute TTL)
- Idempotency support
- Cancel session API
- Enhanced error handling with error codes

---

## 🔍 Current State Analysis

### Existing Pages

1. **DashboardPage.tsx** - Shows pending documents
2. **DocumentDetailPage.tsx** - Document preview & signing
3. **SignDocumentPage.tsx** - Signature canvas
4. **LoginPage.tsx** - Authentication
5. **RegisterPage.tsx** - User registration
6. **HomePage.tsx** - Landing page

### Current Flow (V1)

```
Dashboard → DocumentDetail → SignDocument
```

### New Flow (V2)

```
Dashboard → DocumentDetail → Checkout Session → SigningPage (with sessionId) → Success
```

---

## 🎯 Key Changes Required

### 1. **API Endpoints Changes**

#### Old (V1):

```typescript
POST /documents/:documentSignerId/sign
```

#### New (V2):

```typescript
// Step 1: Create checkout session
POST /documents/:documentSignerId/checkout
→ Returns: { sessionId, expiresIn, expiresAt }

// Step 2: Load session
GET /documents/sessions/:sessionId
→ Returns: { session, document, canSign }

// Step 3: Submit signature
POST /documents/sessions/:sessionId/sign
→ Body: { signatureData, idempotencyKey }

// Step 4: Cancel session (NEW)
DELETE /documents/sessions/:sessionId/cancel
```

### 2. **Error Handling Changes**

#### Old (V1):

```typescript
// Generic error messages
catch (error) {
  alert(error.message);
}
```

#### New (V2):

```typescript
// Structured error codes
catch (error) {
  const { error: errorCode, message } = error.response?.data || {};

  switch (errorCode) {
    case 'SESSION_EXPIRED':
      // Handle session expiration
      break;
    case 'SESSION_DEVICE_MISMATCH':
      // Handle device mismatch
      break;
    // ... 12 error codes total
  }
}
```

### 3. **Session Management (NEW)**

```typescript
// Session timer countdown
const [timeRemaining, setTimeRemaining] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      // Session expired
      navigate("/dashboard");
    }
    setTimeRemaining(remaining);
  }, 1000);

  return () => clearInterval(interval);
}, [session]);
```

### 4. **Cancel Session on Leave (NEW)**

```typescript
// Handle Back button
const handleBack = async () => {
  if (confirm("Cancel signing?")) {
    await api.delete(`/documents/sessions/${sessionId}/cancel`);
    navigate("/dashboard");
  }
};

// Handle browser close
useEffect(() => {
  const handleBeforeUnload = (e) => {
    e.preventDefault();
    navigator.sendBeacon(`/api/documents/sessions/${sessionId}/cancel`);
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [sessionId]);
```

---

## 📝 Implementation Tasks

### Phase 1: Core API Integration (Priority: HIGH)

#### Task 1.1: Update API Service

**File:** `src/services/api.ts`

**Changes:**

- Add new session-based endpoints
- Update error response handling
- Add error code constants

```typescript
// New endpoints
export const signingApi = {
  // Create checkout session
  createCheckoutSession: (documentSignerId: string) =>
    api.post(`/documents/${documentSignerId}/checkout`),

  // Get session details
  getSession: (sessionId: string) =>
    api.get(`/documents/sessions/${sessionId}`),

  // Submit signature with idempotency
  submitSignature: (
    sessionId: string,
    data: {
      signatureData: SignatureData;
      idempotencyKey: string;
    }
  ) => api.post(`/documents/sessions/${sessionId}/sign`, data),

  // Cancel session
  cancelSession: (sessionId: string) =>
    api.delete(`/documents/sessions/${sessionId}/cancel`),
};
```

#### Task 1.2: Add Error Code Constants

**File:** `src/constants/errorCodes.ts` (NEW)

```typescript
export const SigningErrorCode = {
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_COMPLETED: "SESSION_COMPLETED",
  SESSION_DEVICE_MISMATCH: "SESSION_DEVICE_MISMATCH",
  DOCUMENT_LOCKED: "DOCUMENT_LOCKED",
  SIGNING_IN_PROGRESS: "SIGNING_IN_PROGRESS",
  DOCUMENT_NOT_READY: "DOCUMENT_NOT_READY",
  DOCUMENT_ALREADY_COMPLETED: "DOCUMENT_ALREADY_COMPLETED",
  DOCUMENT_CANCELLED: "DOCUMENT_CANCELLED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  INVALID_STATUS: "INVALID_STATUS",
} as const;

export const ErrorMessages: Record<string, string> = {
  SESSION_NOT_FOUND: "Session not found or expired",
  SESSION_EXPIRED: "Session expired. Please create a new session.",
  // ... etc
};
```

#### Task 1.3: Update Types

**File:** `src/types.ts`

```typescript
// Add new types
export interface SigningSession {
  id: string;
  status: "active" | "completed" | "expired";
  expiresAt: number;
  createdAt: number;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  expiresIn: number;
  expiresAt: number;
}

export interface SessionDetailsResponse {
  session: SigningSession;
  document: {
    id: string;
    title: string;
    originalFileUrl: string;
    signatureZone: SignatureZone;
  };
  canSign: boolean;
  reason?: string;
}
```

---

### Phase 2: Update Pages (Priority: HIGH)

#### Task 2.1: Update DocumentDetailPage

**File:** `src/pages/DocumentDetailPage.tsx`

**Changes:**

1. Replace direct signing with checkout session creation
2. Add DOCUMENT_LOCKED error handling
3. Redirect to `/sign/:sessionId` instead of `/sign/:documentSignerId`

**Before:**

```typescript
const handleSign = async () => {
  navigate(`/sign/${documentSignerId}`);
};
```

**After:**

```typescript
const handleStartSigning = async () => {
  try {
    const { data } = await signingApi.createCheckoutSession(documentSignerId);
    navigate(`/sign/${data.sessionId}`);
  } catch (error) {
    const { error: errorCode } = error.response?.data || {};

    if (errorCode === "DOCUMENT_LOCKED") {
      showError("Document is currently being signed by another device");
    } else {
      showError("Failed to start signing session");
    }
  }
};
```

#### Task 2.2: Refactor SignDocumentPage → SigningPage

**File:** `src/pages/SigningPage.tsx` (RENAME from SignDocumentPage.tsx)

**Major Changes:**

1. Accept `sessionId` param instead of `documentSignerId`
2. Load session details on mount
3. Add countdown timer
4. Add cancel session handlers
5. Generate idempotency key
6. Update error handling

**Structure:**

```typescript
const SigningPage = () => {
  const { sessionId } = useParams();

  // State
  const [session, setSession] = useState<SigningSession | null>(null);
  const [document, setDocument] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(
    null
  );

  // Load session
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    // Timer logic
  }, [session]);

  // Cancel on beforeunload
  useEffect(() => {
    // Beacon logic
  }, [sessionId]);

  // Handlers
  const loadSession = async () => {
    /* ... */
  };
  const handleSign = async () => {
    /* ... */
  };
  const handleBack = async () => {
    /* ... */
  };

  return (
    <div>
      {/* Header with timer */}
      {/* PDF Viewer */}
      {/* Signature Canvas */}
      {/* Actions */}
    </div>
  );
};
```

#### Task 2.3: Create Success Page

**File:** `src/pages/SigningSuccessPage.tsx` (NEW)

```typescript
const SigningSuccessPage = () => {
  const location = useLocation();
  const { documentComplete, documentTitle } = location.state || {};

  return (
    <div>
      <h1>✅ Signature Submitted Successfully!</h1>
      <p>{documentTitle}</p>

      {documentComplete ? (
        <div>All signatures collected!</div>
      ) : (
        <div>Waiting for other signers</div>
      )}

      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
    </div>
  );
};
```

---

### Phase 3: UI Enhancements (Priority: MEDIUM)

#### Task 3.1: Add Session Timer Component

**File:** `src/components/SessionTimer.tsx` (NEW)

```typescript
interface Props {
  expiresAt: number;
  onExpired: () => void;
}

const SessionTimer: React.FC<Props> = ({ expiresAt, onExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        onExpired();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getColorClass = () => {
    if (timeRemaining > 300000) return "text-green-600"; // > 5 min
    if (timeRemaining > 60000) return "text-yellow-600"; // 1-5 min
    return "text-red-600"; // < 1 min
  };

  return (
    <div className={`timer ${getColorClass()}`}>
      ⏱️ {formatTime(timeRemaining)}
    </div>
  );
};
```

#### Task 3.2: Add Error Handler Utility

**File:** `src/utils/errorHandler.ts` (NEW)

```typescript
import { SigningErrorCode, ErrorMessages } from "../constants/errorCodes";

export const handleSigningError = (
  error: any,
  navigate: NavigateFunction,
  showError: (msg: string) => void
) => {
  const { error: errorCode, message } = error.response?.data || {};

  switch (errorCode) {
    case SigningErrorCode.SESSION_EXPIRED:
    case SigningErrorCode.SESSION_NOT_FOUND:
      showError(ErrorMessages[errorCode]);
      navigate("/dashboard");
      break;

    case SigningErrorCode.SESSION_DEVICE_MISMATCH:
      showError("This session was created on a different device");
      navigate("/dashboard");
      break;

    case SigningErrorCode.DOCUMENT_LOCKED:
      showError("Document is being signed by another device");
      break;

    case SigningErrorCode.SIGNING_IN_PROGRESS:
      // Retry logic handled by caller
      break;

    default:
      showError(message || "An error occurred");
  }
};
```

---

### Phase 4: Routing Updates (Priority: HIGH)

#### Task 4.1: Update App.tsx Routes

**File:** `src/App.tsx`

**Changes:**

```typescript
// Old route
<Route path="/sign/:documentSignerId" element={<SignDocumentPage />} />

// New routes
<Route path="/sign/:sessionId" element={<SigningPage />} />
<Route path="/signing-success" element={<SigningSuccessPage />} />
```

---

### Phase 5: Testing & Polish (Priority: MEDIUM)

#### Task 5.1: Manual Testing Checklist

- [ ] Create checkout session
- [ ] Session timer countdown works
- [ ] Session expires after 30 minutes
- [ ] Device mismatch detection
- [ ] Idempotency prevents double-signing
- [ ] Cancel session on Back button
- [ ] Cancel session on browser close (beacon)
- [ ] All error codes handled properly
- [ ] Success page shows correct status
- [ ] Mobile responsive

#### Task 5.2: Error Scenario Testing

- [ ] SESSION_EXPIRED - redirect to dashboard
- [ ] SESSION_DEVICE_MISMATCH - show error
- [ ] DOCUMENT_LOCKED - show error
- [ ] SIGNING_IN_PROGRESS - retry after 1s
- [ ] TOO_MANY_ATTEMPTS - create new session
- [ ] Network error - show retry option

---

## 📊 Migration Strategy

### Step 1: Preparation (Day 1)

- ✅ Create branch `beta/v2`
- ✅ Copy docs from backend
- [ ] Review current code
- [ ] Create implementation plan

### Step 2: Core Implementation (Day 2-3)

- [ ] Update API service
- [ ] Add error code constants
- [ ] Update types
- [ ] Refactor SignDocumentPage → SigningPage
- [ ] Update DocumentDetailPage

### Step 3: UI Enhancements (Day 4)

- [ ] Add SessionTimer component
- [ ] Add error handler utility
- [ ] Create SigningSuccessPage
- [ ] Update routes

### Step 4: Testing (Day 5)

- [ ] Manual testing all scenarios
- [ ] Error handling verification
- [ ] Mobile testing
- [ ] Cross-browser testing

### Step 5: Deployment (Day 6)

- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Production deployment

---

## 🚨 Breaking Changes

### API Changes

1. **Endpoint structure changed**

   - Old: `/documents/:documentSignerId/sign`
   - New: `/documents/sessions/:sessionId/sign`

2. **Response format changed**

   - Old: Direct success/error
   - New: Structured error codes

3. **Session required**
   - Old: Direct signing
   - New: Must create checkout session first

### URL Changes

1. **Signing page route**
   - Old: `/sign/:documentSignerId`
   - New: `/sign/:sessionId`

### State Management

1. **Session state required**
   - Must track session expiration
   - Must handle device locking

---

## 📚 References

- Backend Docs: `/home/ducbinh/Workspace/rsign-be/docs/v2/`
- Frontend Docs: `/home/ducbinh/Workspace/rsign-fe/docs/USER_SIGNING_WORKFLOW.md`
- Error Codes: See `FRONTEND_INTEGRATION_GUIDE.md` section 6.2

---

## ✅ Success Criteria

1. ✅ User can create checkout session
2. ✅ Session timer displays correctly
3. ✅ Device locking works (only one device at a time)
4. ✅ Idempotency prevents duplicate signatures
5. ✅ Cancel session releases lock immediately
6. ✅ All error codes handled gracefully
7. ✅ Mobile experience is smooth
8. ✅ No breaking changes for existing users

---

**Next Steps:**

1. Review this plan
2. Start with Phase 1: Core API Integration
3. Test each phase before moving to next

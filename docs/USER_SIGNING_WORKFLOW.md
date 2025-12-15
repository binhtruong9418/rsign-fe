# RSign V2 - User Signing Workflow (Detailed)

**Audience:** Frontend Developers  
**Focus:** User-facing signing experience  
**Last Updated:** 2025-12-15

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Complete User Journey](#2-complete-user-journey)
3. [Page-by-Page Breakdown](#3-page-by-page-breakdown)
4. [API Integration Details](#4-api-integration-details)
5. [UI/UX Requirements](#5-uiux-requirements)
6. [Error Scenarios](#6-error-scenarios)
7. [Mobile Considerations](#7-mobile-considerations)

---

## 1. Overview

### 1.1 User Signing Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER SIGNING FLOW                        │
└─────────────────────────────────────────────────────────────────┘

    [Login]
       ↓
    [Dashboard/Home]
       ↓
    [Pending Documents List] ← User sees all documents waiting for signature
       ↓
    [Document Details] ← User reviews document before signing
       ↓
    [Create Checkout Session] ← Backend creates device-locked session
       ↓
    [Redirect to Signing Page] ← User is redirected with sessionId
       ↓
    [Load Session & Document] ← Validate device, load PDF
       ↓
    [Draw Signature] ← User draws signature on canvas
       ↓
    [Submit Signature] ← Send to backend with idempotency
       ↓
    [Success Page] ← Show completion status
       ↓
    [Back to Dashboard]
```

### 1.2 Key Concepts

**Checkout Session:**

- Similar to payment checkout (Stripe, PayPal)
- Device-locked: Only the device that created the session can sign
- 30-minute expiration
- Single-use: Cannot be reused after signing

**Device Fingerprinting:**

- Backend generates SHA-256 hash from: User-Agent + IP + Language
- Prevents session hijacking
- Ensures security across devices

**Idempotency:**

- Prevents duplicate signatures if user clicks "Sign" multiple times
- Frontend generates UUID, backend caches result for 24 hours

---

## 2. Complete User Journey

### Step 1: Login

**Page:** `/login`  
**API:** `POST /auth/login`

```typescript
// User enters credentials
const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password });

  // Store token
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  // Redirect to dashboard
  navigate("/dashboard");
};
```

**UI Requirements:**

- Email input (validated)
- Password input (hidden)
- "Login with HUST" button (SSO)
- "Forgot password?" link
- Error messages for invalid credentials

---

### Step 2: Dashboard/Home

**Page:** `/dashboard`  
**API:** `GET /documents/pending?page=0&limit=10`

```typescript
const DashboardPage = () => {
  const [pendingDocs, setPendingDocs] = useState<PageDto<PendingDocument>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    try {
      const { data } = await api.get("/documents/pending", {
        params: { page: 0, limit: 10 },
      });
      setPendingDocs(data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Pending Documents</h1>
      {pendingDocs?.items.map((doc) => (
        <DocumentCard
          key={doc.documentSignerId}
          document={doc}
          onClick={() => navigate(`/documents/${doc.documentSignerId}`)}
        />
      ))}
    </div>
  );
};
```

**Response Data:**

```json
{
  "items": [
    {
      "documentSignerId": "signer-uuid-1",
      "document": {
        "id": "doc-uuid-1",
        "title": "Employment Contract 2024",
        "createdBy": "HR Manager",
        "deadline": "2024-12-31T23:59:59Z"
      },
      "status": "PENDING"
    }
  ],
  "page": 0,
  "limit": 10,
  "total": 5,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

**UI Requirements:**

- **Document Card** for each pending document:
  - Document title (large, bold)
  - Created by (small text)
  - Deadline (if exists, highlighted if < 3 days)
  - Status badge ("Pending")
  - "View & Sign" button
- **Empty State** if no pending documents:
  - Icon (document with checkmark)
  - "No pending documents"
  - "You're all caught up!"
- **Loading State**: Skeleton cards
- **Pagination**: If total > 10

**Wireframe:**

```
┌─────────────────────────────────────────────┐
│  Pending Documents                    [👤]  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 📄 Employment Contract 2024           │ │
│  │ Created by: HR Manager                │ │
│  │ Deadline: Dec 31, 2024  [PENDING]     │ │
│  │                    [View & Sign →]    │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 📄 NDA Agreement                      │ │
│  │ Created by: Legal Team                │ │
│  │ Deadline: Dec 25, 2024  [PENDING]     │ │
│  │                    [View & Sign →]    │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [← Previous]              [Next →]        │
└─────────────────────────────────────────────┘
```

---

### Step 3: Document Details

**Page:** `/documents/:documentSignerId`  
**API:** `GET /documents/:documentSignerId/details`

```typescript
const DocumentDetailsPage = () => {
  const { documentSignerId } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [documentSignerId]);

  const loadDetails = async () => {
    try {
      const { data } = await api.get(`/documents/${documentSignerId}/details`);
      setDetails(data);
    } catch (error) {
      console.error("Failed to load details:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSigning = async () => {
    try {
      // Create checkout session
      const { data } = await api.post(
        `/documents/${documentSignerId}/checkout`
      );

      // Redirect to signing page with sessionId
      navigate(`/sign/${data.sessionId}`);
    } catch (error) {
      const { error: errorCode, message } = error.response?.data || {};

      if (errorCode === "DOCUMENT_LOCKED") {
        alert(
          "This document is currently being signed by another device. Please try again later."
        );
      } else {
        alert(message || "Failed to start signing session");
      }
    }
  };

  return (
    <div>
      <h1>{details.document.title}</h1>

      {/* PDF Preview */}
      <PDFViewer url={details.document.originalFileUrl} />

      {/* Document Info */}
      <div className="info">
        <p>Deadline: {formatDate(details.document.deadline)}</p>
        <p>Signature Zone: Page {details.signatureZone.pageNumber}</p>
      </div>

      {/* Actions */}
      <button onClick={handleStartSigning}>Start Signing</button>
      <button
        onClick={() => navigate(`/documents/${documentSignerId}/decline`)}
      >
        Decline
      </button>
    </div>
  );
};
```

**Response Data:**

```json
{
  "id": "signer-uuid-1",
  "document": {
    "id": "doc-uuid-1",
    "title": "Employment Contract 2024",
    "originalFileUrl": "https://minio.rsign.com/documents/contract.pdf",
    "deadline": "2024-12-31T23:59:59Z"
  },
  "signatureZone": {
    "id": "zone-uuid-1",
    "pageNumber": 5,
    "x": 100,
    "y": 700,
    "width": 200,
    "height": 60,
    "label": "Employee Signature"
  },
  "status": "PENDING"
}
```

**UI Requirements:**

- **PDF Viewer**:
  - Full document preview
  - Zoom controls (+/-)
  - Page navigation
  - Highlight signature zone (red rectangle on correct page)
- **Document Information Panel**:
  - Title
  - Deadline (with countdown if < 7 days)
  - Signature location (e.g., "Page 5, Bottom Right")
  - Document type/category (if available)
- **Action Buttons**:
  - "Start Signing" (primary, large)
  - "Decline" (secondary, smaller)
  - "Download PDF" (optional)
- **Warning Banner** if deadline is soon:
  - "⚠️ This document expires in 3 days"

**Wireframe:**

```
┌─────────────────────────────────────────────┐
│  ← Back    Employment Contract 2024         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │         PDF PREVIEW                   │ │
│  │                                       │ │
│  │  [Page 5 of 12]                       │ │
│  │                                       │ │
│  │  ┌─────────────────┐ ← Signature Zone│ │
│  │  │ Sign here       │                  │ │
│  │  └─────────────────┘                  │ │
│  │                                       │ │
│  │  [−]  100%  [+]                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  📅 Deadline: Dec 31, 2024 (16 days left)  │
│  📍 Signature: Page 5, Bottom Right        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │      [Start Signing]                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Decline Document]                         │
└─────────────────────────────────────────────┘
```

---

### Step 4: Create Checkout Session

**API:** `POST /documents/:documentSignerId/checkout`

**This happens automatically when user clicks "Start Signing"**

```typescript
const createCheckoutSession = async (documentSignerId: string) => {
  try {
    const { data } = await api.post(`/documents/${documentSignerId}/checkout`);

    // data = {
    //   sessionId: "rsign_abc123...",
    //   expiresIn: 1800,
    //   expiresAt: 1702345678000
    // }

    return data;
  } catch (error) {
    const { error: errorCode } = error.response?.data || {};

    if (errorCode === "DOCUMENT_LOCKED") {
      throw new Error("Another device is currently signing this document");
    } else if (errorCode === "DOCUMENT_NOT_READY") {
      throw new Error("Document is not ready for signing");
    } else if (errorCode === "DOCUMENT_ALREADY_COMPLETED") {
      throw new Error("Document has already been signed");
    }

    throw error;
  }
};
```

**Important:**

- This API creates a **device-locked** session
- Only this device can use the session
- Session expires in 30 minutes
- If another device tries to create a session, it will fail with `DOCUMENT_LOCKED`

---

### Step 5: Signing Page

**Page:** `/sign/:sessionId`  
**APIs:**

- `GET /documents/sessions/:sessionId` (load session)
- `POST /documents/sessions/:sessionId/sign` (submit signature)

```typescript
const SigningPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<SigningSession | null>(null);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const remaining = session.expiresAt - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        alert("Session expired. Please create a new session.");
        navigate("/dashboard");
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const loadSession = async () => {
    try {
      const { data } = await api.get(`/documents/sessions/${sessionId}`);

      if (!data.canSign) {
        alert(data.reason || "Cannot sign this document");
        navigate("/dashboard");
        return;
      }

      setSession(data.session);
      setDocument(data.document);
      setTimeRemaining(data.session.expiresAt - Date.now());
    } catch (error) {
      const { error: errorCode, message } = error.response?.data || {};

      if (
        errorCode === "SESSION_NOT_FOUND" ||
        errorCode === "SESSION_EXPIRED"
      ) {
        alert("Session not found or expired. Please try again.");
      } else if (errorCode === "SESSION_DEVICE_MISMATCH") {
        alert(
          "This session was created on a different device. Please create a new session on this device."
        );
      } else {
        alert(message || "Failed to load session");
      }

      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureData) {
      alert("Please draw your signature first");
      return;
    }

    setSubmitting(true);

    try {
      // Generate idempotency key
      const idempotencyKey = crypto.randomUUID();

      const { data } = await api.post(`/documents/sessions/${sessionId}/sign`, {
        signatureData,
        idempotencyKey,
      });

      if (data.success) {
        navigate("/signing-success", {
          state: {
            documentComplete: data.documentComplete,
            documentTitle: document.title,
          },
        });
      }
    } catch (error) {
      const { error: errorCode, message } = error.response?.data || {};

      switch (errorCode) {
        case "SESSION_EXPIRED":
          alert("Session expired. Please create a new session.");
          navigate("/dashboard");
          break;

        case "SESSION_COMPLETED":
          alert("This document has already been signed.");
          navigate("/dashboard");
          break;

        case "SIGNING_IN_PROGRESS":
          // Retry after 1 second
          setTimeout(() => handleSign(), 1000);
          break;

        case "TOO_MANY_ATTEMPTS":
          alert("Too many attempts. Please create a new session.");
          navigate("/dashboard");
          break;

        default:
          alert(message || "Failed to submit signature");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="signing-page">
      {/* Header with timer */}
      <div className="header">
        <h1>{document.title}</h1>
        <div className={`timer ${timeRemaining < 300000 ? "warning" : ""}`}>
          ⏱️ {formatTime(timeRemaining)}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="pdf-viewer">
        <PDFViewer
          url={document.originalFileUrl}
          highlightZone={document.signatureZone}
        />
      </div>

      {/* Signature Canvas */}
      <div className="signature-section">
        <h2>Your Signature</h2>
        <SignatureCanvas
          width={document.signatureZone.width}
          height={document.signatureZone.height}
          onChange={setSignatureData}
        />
        <div className="actions">
          <button onClick={() => setSignatureData(null)}>Clear</button>
          <button
            onClick={handleSign}
            disabled={!signatureData || submitting}
            className="primary"
          >
            {submitting ? "Submitting..." : "Sign Document"}
          </button>
        </div>
      </div>

      {/* Warning: Don't close tab */}
      <div className="warning">
        ⚠️ Do not close this tab or navigate away during signing
      </div>
    </div>
  );
};
```

**Response Data (GET /documents/sessions/:sessionId):**

```json
{
  "session": {
    "id": "rsign_abc123...",
    "status": "active",
    "expiresAt": 1702345678000,
    "createdAt": 1702343878000
  },
  "document": {
    "id": "doc-uuid-1",
    "title": "Employment Contract 2024",
    "originalFileUrl": "https://minio.rsign.com/documents/contract.pdf",
    "signatureZone": {
      "pageNumber": 5,
      "x": 100,
      "y": 700,
      "width": 200,
      "height": 60,
      "label": "Employee Signature"
    }
  },
  "canSign": true
}
```

**UI Requirements:**

**Header:**

- Document title
- Session timer (countdown)
  - Green if > 5 minutes
  - Yellow if 1-5 minutes
  - Red if < 1 minute

**PDF Viewer:**

- Full document display
- Auto-scroll to signature page
- Highlight signature zone with red rectangle
- Zoom controls
- Page navigation

**Signature Canvas:**

- Touch/mouse drawing support
- Smooth stroke rendering
- "Clear" button
- Preview of signature
- Responsive size (match signature zone dimensions)

**Actions:**

- "Clear" button (secondary)
- "Sign Document" button (primary, large)
  - Disabled if no signature drawn
  - Shows "Submitting..." when processing

**Warnings:**

- "Do not close this tab" message
- Session expiration warning when < 5 minutes

**Wireframe:**

```
┌─────────────────────────────────────────────┐
│  Employment Contract 2024      ⏱️ 28:45     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │         PDF PREVIEW                   │ │
│  │         (Page 5 of 12)                │ │
│  │                                       │ │
│  │  ┌─────────────────┐ ← Red highlight │ │
│  │  │ Sign here       │                  │ │
│  │  └─────────────────┘                  │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Your Signature                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │   [User draws signature here]         │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [Clear]              [Sign Document]      │
│                                             │
│  ⚠️ Do not close this tab during signing   │
└─────────────────────────────────────────────┘
```

---

### Step 6: Success Page

**Page:** `/signing-success`

```typescript
const SigningSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentComplete, documentTitle } = location.state || {};

  return (
    <div className="success-page">
      <div className="icon">✅</div>
      <h1>Signature Submitted Successfully!</h1>

      <p className="document-title">{documentTitle}</p>

      {documentComplete ? (
        <div className="status complete">
          <p>✨ All signatures collected!</p>
          <p>The document is now complete and will be processed shortly.</p>
        </div>
      ) : (
        <div className="status pending">
          <p>⏳ Waiting for other signers</p>
          <p>You'll be notified when the document is fully signed.</p>
        </div>
      )}

      <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
    </div>
  );
};
```

**UI Requirements:**

- Large success icon (checkmark)
- Document title
- Status message:
  - If `documentComplete === true`: "All signatures collected"
  - If `documentComplete === false`: "Waiting for other signers"
- "Back to Dashboard" button
- Optional: Confetti animation

**Wireframe:**

```
┌─────────────────────────────────────────────┐
│                                             │
│              ✅                             │
│                                             │
│     Signature Submitted Successfully!       │
│                                             │
│     Employment Contract 2024                │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  ⏳ Waiting for other signers         │ │
│  │                                       │ │
│  │  You'll be notified when the          │ │
│  │  document is fully signed.            │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │      [Back to Dashboard]            │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 4. API Integration Details

### 4.1 Complete API List for User Flow

| Step         | API Endpoint                            | Method | Purpose                       |
| ------------ | --------------------------------------- | ------ | ----------------------------- |
| Login        | `/auth/login`                           | POST   | Authenticate user             |
| Dashboard    | `/documents/pending`                    | GET    | List pending documents        |
| Details      | `/documents/:documentSignerId/details`  | GET    | Get document details          |
| Checkout     | `/documents/:documentSignerId/checkout` | POST   | Create signing session        |
| Load Session | `/documents/sessions/:sessionId`        | GET    | Validate & load session       |
| Sign         | `/documents/sessions/:sessionId/sign`   | POST   | Submit signature              |
| Cancel       | `/documents/sessions/:sessionId/cancel` | DELETE | Cancel session & release lock |
| Decline      | `/documents/:documentSignerId/decline`  | POST   | Decline document              |

### 4.2 Request/Response Examples

#### Get Pending Documents

```typescript
// Request
GET /documents/pending?page=0&limit=10

// Response
{
  "items": [
    {
      "documentSignerId": "signer-uuid-1",
      "document": {
        "id": "doc-uuid-1",
        "title": "Employment Contract 2024",
        "createdBy": "HR Manager",
        "deadline": "2024-12-31T23:59:59Z"
      },
      "status": "PENDING"
    }
  ],
  "page": 0,
  "limit": 10,
  "total": 5,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

#### Get Document Details

```typescript
// Request
GET /documents/signer-uuid-1/details

// Response
{
  "id": "signer-uuid-1",
  "document": {
    "id": "doc-uuid-1",
    "title": "Employment Contract 2024",
    "originalFileUrl": "https://minio.rsign.com/documents/contract.pdf",
    "deadline": "2024-12-31T23:59:59Z"
  },
  "signatureZone": {
    "id": "zone-uuid-1",
    "pageNumber": 5,
    "x": 100,
    "y": 700,
    "width": 200,
    "height": 60,
    "label": "Employee Signature"
  },
  "status": "PENDING"
}
```

#### Create Checkout Session

```typescript
// Request
POST /documents/signer-uuid-1/checkout

// Response
{
  "sessionId": "rsign_abc123def456...",
  "expiresIn": 1800,
  "expiresAt": 1702345678000
}
```

#### Get Session

```typescript
// Request
GET /documents/sessions/rsign_abc123def456...

// Response
{
  "session": {
    "id": "rsign_abc123def456...",
    "status": "active",
    "expiresAt": 1702345678000,
    "createdAt": 1702343878000
  },
  "document": {
    "id": "doc-uuid-1",
    "title": "Employment Contract 2024",
    "originalFileUrl": "https://minio.rsign.com/documents/contract.pdf",
    "signatureZone": {
      "pageNumber": 5,
      "x": 100,
      "y": 700,
      "width": 200,
      "height": 60
    }
  },
  "canSign": true
}
```

#### Submit Signature

```typescript
// Request
POST /documents/sessions/rsign_abc123def456.../sign
{
  "signatureData": {
    "strokes": [
      {
        "id": "stroke-1",
        "points": [
          { "x": 10, "y": 20, "timestamp": 1702345678000 },
          { "x": 15, "y": 25, "timestamp": 1702345678100 }
        ]
      }
    ],
    "color": "#000000",
    "width": 2
  },
  "idempotencyKey": "uuid-generated-by-frontend"
}

// Response
{
  "success": true,
  "documentComplete": false,
  "documentSigner": {
    "id": "signer-uuid-1",
    "status": "SIGNED",
    "signedAt": "2024-12-15T10:30:00Z"
  }
}
```

#### Cancel Session

**⚠️ NEW: Cancel active session when user leaves signing page**

```typescript
// Request
DELETE /documents/sessions/rsign_abc123def456.../cancel

// Response
{
  "success": true
}

// Frontend Implementation
const SigningPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Handle Back button click
  const handleBack = async () => {
    if (confirm('Are you sure you want to cancel signing?')) {
      try {
        await api.delete(`/documents/sessions/${sessionId}/cancel`);
      } catch (error) {
        console.error('Failed to cancel:', error);
      } finally {
        navigate('/dashboard');
      }
    }
  };

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';

      // Best-effort cancel (may not complete if user confirms close)
      navigator.sendBeacon(
        `${API_URL}/documents/sessions/${sessionId}/cancel`
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

  return (
    <div>
      <button onClick={handleBack}>← Back</button>
      {/* ... signing UI ... */}
    </div>
  );
};
```

**Benefits:**

- ✅ Immediate lock release when user leaves
- ✅ Other users can sign immediately
- ✅ No need to wait for 30-minute timeout
- ✅ Better user experience

---

## 5. UI/UX Requirements

### 5.1 Loading States

**Every page must have:**

- Skeleton loaders for initial load
- Spinner for actions (buttons)
- Progress indicators for long operations

**Example:**

```typescript
{
  loading ? <SkeletonCard /> : <DocumentCard data={document} />;
}
```

### 5.2 Empty States

**Pending Documents (no documents):**

```
┌─────────────────────────────────┐
│                                 │
│          📄                     │
│                                 │
│   No Pending Documents          │
│   You're all caught up!         │
│                                 │
└─────────────────────────────────┘
```

### 5.3 Error States

**Network Error:**

```
┌─────────────────────────────────┐
│          ⚠️                     │
│   Failed to load documents      │
│   [Retry]                       │
└─────────────────────────────────┘
```

### 5.4 Responsive Design

**Mobile (< 768px):**

- Stack elements vertically
- Full-width buttons
- Simplified navigation
- Touch-optimized signature canvas

**Tablet (768px - 1024px):**

- 2-column layout for document list
- Side-by-side PDF and signature

**Desktop (> 1024px):**

- 3-column layout for document list
- Split view: PDF left, signature right

---

## 6. Error Scenarios

### 6.1 Session Expired During Signing

**Scenario:** User takes too long to sign (> 30 minutes)

**Detection:**

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (Date.now() > session.expiresAt) {
      alert("Session expired. Please create a new session.");
      navigate("/dashboard");
    }
  }, 1000);

  return () => clearInterval(interval);
}, [session]);
```

**UI:**

- Show countdown timer
- Warning when < 5 minutes
- Auto-redirect when expired

### 6.2 Device Mismatch

**Scenario:** User opens session link on different device

**Error Response:**

```json
{
  "success": false,
  "error": "SESSION_DEVICE_MISMATCH",
  "message": "Device verification failed. This session was created on a different device.",
  "statusCode": 400
}
```

**UI:**

- Show error message
- Explain: "This session was created on another device"
- Offer: "Create new session on this device"

### 6.3 Document Already Locked

**Scenario:** User tries to sign while another device has active session

**Error Response:**

```json
{
  "success": false,
  "error": "DOCUMENT_LOCKED",
  "message": "Document is currently being signed by another device",
  "statusCode": 400
}
```

**UI:**

- Show error message
- Explain: "Someone else is signing this document"
- Offer: "Try again in a few minutes"

### 6.4 Network Issues

**Scenario:** API call fails due to network

**Handling:**

```typescript
try {
  await api.post("/sign", data);
} catch (error) {
  if (!error.response) {
    // Network error
    showError("Network error. Please check your connection.");
    // Offer retry
  }
}
```

---

## 7. Mobile Considerations

### 7.1 Touch Signature

**Requirements:**

- Smooth touch drawing
- Prevent page scroll while drawing
- Support multi-touch (pinch zoom on PDF)

**Implementation:**

```typescript
const SignatureCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault(); // Prevent scroll
    // Start drawing
  };

  return (
    <canvas
      ref={canvasRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};
```

### 7.2 Mobile Layout

**Signing Page on Mobile:**

```
┌─────────────────────┐
│ Contract    ⏱️ 28:45│
├─────────────────────┤
│                     │
│   PDF Preview       │
│   (scrollable)      │
│                     │
├─────────────────────┤
│ Your Signature      │
│ ┌─────────────────┐ │
│ │  [Draw here]    │ │
│ └─────────────────┘ │
│ [Clear] [Sign]      │
└─────────────────────┘
```

### 7.3 Offline Handling

**Detect offline:**

```typescript
useEffect(() => {
  const handleOffline = () => {
    showWarning("You are offline. Please reconnect to continue.");
  };

  window.addEventListener("offline", handleOffline);
  return () => window.removeEventListener("offline", handleOffline);
}, []);
```

---

## 8. Summary Checklist

### For Each Page:

**Dashboard:**

- [ ] Load pending documents
- [ ] Show loading state
- [ ] Show empty state
- [ ] Pagination
- [ ] Click to view details

**Document Details:**

- [ ] Load document details
- [ ] Show PDF preview
- [ ] Highlight signature zone
- [ ] "Start Signing" button
- [ ] Handle DOCUMENT_LOCKED error

**Signing Page:**

- [ ] Load session
- [ ] Validate device
- [ ] Show countdown timer
- [ ] PDF viewer with highlight
- [ ] Signature canvas
- [ ] Submit with idempotency
- [ ] Handle all error codes
- [ ] Prevent navigation during signing

**Success Page:**

- [ ] Show success message
- [ ] Show document status
- [ ] "Back to Dashboard" button

---

## 9. Testing Scenarios

### Test Case 1: Happy Path

1. Login
2. See pending documents
3. Click "View & Sign"
4. Review document
5. Click "Start Signing"
6. Draw signature
7. Click "Sign Document"
8. See success page

### Test Case 2: Session Expiration

1. Start signing
2. Wait 30 minutes
3. Try to sign
4. See "Session expired" error
5. Redirect to dashboard

### Test Case 3: Device Mismatch

1. Create session on Device A
2. Copy session URL
3. Open URL on Device B
4. See "Device mismatch" error

### Test Case 4: Concurrent Signing

1. User A starts signing
2. User B tries to start signing same document
3. User B sees "Document locked" error
4. User A completes signing
5. User B can now start signing

---

**End of User Workflow Documentation**

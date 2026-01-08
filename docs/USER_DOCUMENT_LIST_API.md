# User Document List API Documentation

## Overview

This document covers the **List APIs** for user documents. These are optimized endpoints that return lightweight responses suitable for displaying document lists in the UI.

**Key Difference from Detail APIs:**
- List APIs return **12 essential fields** per document
- Detail APIs return full document information (40+ fields)
- List APIs are ~70% smaller in response size

---

## Endpoints

### 1. Get Pending Documents
**GET** `/api/documents/pending`

Returns paginated list of documents that require the user's signature.

**Important Logic:**
- Shows documents where user **hasn't completed their signatures** yet
- In SHARED PARALLEL mode: If user completed their part but others haven't, document moves to `/completed` (not `/pending`)

#### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  page?: number;      // Default: 0
  limit?: number;     // Default: 10
  sortBy?: "createdAt" | "deadline" | "title";  // Default: "createdAt"
  sortOrder?: "ASC" | "DESC";  // Default: "DESC"
}
```

#### Response

**Success (200):**
```json
{
  "items": [
    {
      "id": "doc-uuid-123",
      "title": "Contract Agreement Q1 2026",
      "status": "PENDING",
      "signingMode": "MULTI",
      "signingFlow": "PARALLEL",
      "createdAt": "2026-01-08T10:00:00Z",
      "deadline": "2026-01-15T23:59:59Z",
      "isOverdue": false,
      
      // Overall progress (all signers in document)
      "totalSignatures": 15,
      "completedSignatures": 8,
      
      // User's personal progress
      "signedCount": 1,
      "requiredCount": 3
    }
  ],
  "page": 0,
  "limit": 10,
  "total": 25,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document UUID |
| `title` | string | Document title |
| `status` | string | Document status: `DRAFT`, `PENDING`, `COMPLETED`, `REJECTED`, `EXPIRED` |
| `signingMode` | string | `INDIVIDUAL` or `MULTI` |
| `signingFlow` | string | `PARALLEL` or `SEQUENTIAL` |
| `createdAt` | ISO8601 | Document creation timestamp |
| `deadline` | ISO8601 \| null | Signing deadline |
| `isOverdue` | boolean | Whether deadline has passed |
| `totalSignatures` | number | Total signatures needed from ALL signers |
| `completedSignatures` | number | Total signatures completed by ALL signers |
| `signedCount` | number | How many signatures **user** has completed |
| `requiredCount` | number | How many signatures **user** needs to complete |

---

### 2. Get Completed Documents
**GET** `/api/documents/completed`

Returns paginated list of documents where the user has completed all their signatures.

**Important Logic:**
- Shows documents where user **has completed their signatures**
- Document may still be PENDING if other signers haven't finished (SHARED PARALLEL mode)
- To check if document is fully completed, use the detail API

#### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
```typescript
{
  page?: number;      // Default: 0
  limit?: number;     // Default: 10
  sortBy?: "createdAt" | "deadline" | "title";  // Default: "createdAt"
  sortOrder?: "ASC" | "DESC";  // Default: "DESC"
}
```

#### Response

**Success (200):**
```json
{
  "data": [
    {
      "id": "doc-uuid-456",
      "title": "NDA Agreement",
      "status": "PENDING",
      "signingMode": "MULTI",
      "signingFlow": "PARALLEL",
      "createdAt": "2026-01-05T09:00:00Z",
      "deadline": "2026-01-20T23:59:59Z",
      "isOverdue": false,
      
      // Overall progress
      "totalSignatures": 10,
      "completedSignatures": 7,
      
      // User completed their part
      "signedCount": 2,
      "requiredCount": 2
    },
    {
      "id": "doc-uuid-789",
      "title": "Employee Handbook",
      "status": "COMPLETED",
      "signingMode": "INDIVIDUAL",
      "signingFlow": "PARALLEL",
      "createdAt": "2026-01-01T08:00:00Z",
      "deadline": null,
      "isOverdue": false,
      
      "totalSignatures": 1,
      "completedSignatures": 1,
      
      "signedCount": 1,
      "requiredCount": 1
    }
  ],
  "page": 0,
  "limit": 10,
  "total": 42,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

---

### 3. Get All Documents (Optional)
**GET** `/api/documents/`

Returns all documents (both pending and completed) with optional status filter.

#### Request

**Query Parameters:**
```typescript
{
  status?: string;    // Optional: "PENDING", "COMPLETED", etc.
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "deadline" | "title";
  sortOrder?: "ASC" | "DESC";
}
```

#### Response
Same format as pending/completed endpoints.

---

## UI Integration Guide

### Displaying Document Lists

#### React Example - Pending List
```tsx
interface DocumentListItem {
  id: string;
  title: string;
  status: string;
  signingMode: string;
  signingFlow: string;
  createdAt: string;
  deadline: string | null;
  isOverdue: boolean;
  totalSignatures: number;
  completedSignatures: number;
  signedCount: number;
  requiredCount: number;
}

function PendingDocumentsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'pending', page],
    queryFn: () => fetch('/api/documents/pending?page=0&limit=10').then(r => r.json())
  });

  return (
    <div className="documents-list">
      {data?.items.map((doc: DocumentListItem) => (
        <DocumentCard key={doc.id}>
          <div className="header">
            <h3>{doc.title}</h3>
            <Badge variant={doc.signingMode}>
              {doc.signingMode} • {doc.signingFlow}
            </Badge>
          </div>

          <div className="progress">
            {/* User's personal progress */}
            <ProgressBar 
              current={doc.signedCount} 
              total={doc.requiredCount}
              label="Your progress"
            />
            <span className="progress-text">
              {doc.signedCount}/{doc.requiredCount} signatures completed
            </span>
          </div>

          <div className="overall-info">
            {/* Overall document progress */}
            <InfoText>
              Overall: {doc.completedSignatures}/{doc.totalSignatures} 
              ({Math.round(doc.completedSignatures / doc.totalSignatures * 100)}%)
            </InfoText>
          </div>

          {doc.deadline && (
            <div className={`deadline ${doc.isOverdue ? 'overdue' : ''}`}>
              {doc.isOverdue ? (
                <WarningIcon /> Overdue
              ) : (
                <ClockIcon /> Due {formatDate(doc.deadline)}
              )}
            </div>
          )}

          <Button onClick={() => navigate(`/documents/${doc.id}/pending`)}>
            Sign Now
          </Button>
        </DocumentCard>
      ))}

      <Pagination 
        page={data?.page}
        totalPages={data?.totalPages}
        hasNext={data?.hasNextPage}
        hasPrevious={data?.hasPreviousPage}
      />
    </div>
  );
}
```

#### React Example - Completed List
```tsx
function CompletedDocumentsList() {
  const { data } = useQuery({
    queryKey: ['documents', 'completed', page],
    queryFn: () => fetch('/api/documents/completed?page=0&limit=10')
  });

  return (
    <div className="documents-list">
      {data?.items.map((doc: DocumentListItem) => (
        <DocumentCard key={doc.id}>
          <div className="header">
            <h3>{doc.title}</h3>
            <StatusBadge status={doc.status} />
          </div>

          <div className="completion-info">
            <CheckCircleIcon className="success" />
            <span>You completed {doc.signedCount} signatures</span>
          </div>

          {/* Show if document is fully completed or waiting for others */}
          {doc.status === 'PENDING' ? (
            <Alert variant="info">
              ⏳ Waiting for other signers 
              ({doc.completedSignatures}/{doc.totalSignatures} completed)
            </Alert>
          ) : (
            <Alert variant="success">
              ✅ Document fully completed
            </Alert>
          )}

          <div className="actions">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/documents/${doc.id}/completed`)}
            >
              View Details
            </Button>
            
            {doc.status === 'COMPLETED' && (
              <Button onClick={() => downloadDocument(doc.id)}>
                Download
              </Button>
            )}
          </div>
        </DocumentCard>
      ))}
    </div>
  );
}
```

### State Management

#### React Query Setup
```typescript
// hooks/useDocuments.ts
export function usePendingDocuments(page: number = 0, limit: number = 10) {
  return useQuery({
    queryKey: ['documents', 'pending', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/documents/pending', {
        params: { page, limit, sortBy: 'deadline', sortOrder: 'ASC' }
      });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });
}

export function useCompletedDocuments(page: number = 0, limit: number = 10) {
  return useQuery({
    queryKey: ['documents', 'completed', page, limit],
    queryFn: async () => {
      const response = await apiClient.get('/documents/completed', {
        params: { page, limit, sortBy: 'createdAt', sortOrder: 'DESC' }
      });
      return response.data;
    },
    staleTime: 60000, // 1 minute (completed docs change less frequently)
  });
}
```

---

## Understanding Status Logic

### Pending vs Completed (User Perspective)

The **key difference** is based on **user's completion status**, not document status:

| Scenario | User Status | Document Status | Shows In |
|----------|-------------|-----------------|----------|
| User hasn't signed yet | `signedCount < requiredCount` | PENDING | `/pending` |
| User signed, others pending (SHARED) | `signedCount === requiredCount` | PENDING | `/completed` ⚠️ |
| All signatures completed | `signedCount === requiredCount` | COMPLETED | `/completed` ✅ |
| User signed INDIVIDUAL doc | `signedCount === requiredCount` | COMPLETED | `/completed` |

**Important:** In SHARED PARALLEL mode, a document appears in `/completed` as soon as the user finishes their signatures, even if other signers haven't finished yet!

### Visual Indicators

```tsx
function getDocumentStatusInfo(doc: DocumentListItem) {
  const userCompleted = doc.signedCount === doc.requiredCount;
  const documentCompleted = doc.status === 'COMPLETED';
  const allSignersCompleted = doc.completedSignatures === doc.totalSignatures;

  if (!userCompleted) {
    return {
      icon: '📝',
      text: 'Action required',
      variant: 'warning',
      badge: `${doc.signedCount}/${doc.requiredCount} signed`
    };
  }

  if (userCompleted && !documentCompleted) {
    return {
      icon: '⏳',
      text: 'Waiting for others',
      variant: 'info',
      badge: `${doc.completedSignatures}/${doc.totalSignatures} total`
    };
  }

  if (documentCompleted) {
    return {
      icon: '✅',
      text: 'Completed',
      variant: 'success',
      badge: 'All signed'
    };
  }
}
```

---

## Performance Optimization

### Response Size Comparison

**List API (12 fields):**
- Single item: ~0.4 KB
- 10 items: ~4 KB
- 100 items: ~40 KB

**Detail API (40+ fields):**
- Single item: ~8-12 KB

**Savings:** ~70% smaller response size

### Caching Strategy

```typescript
// Recommended cache times
const CACHE_STRATEGY = {
  pending: {
    staleTime: 30000,    // 30s (frequently changing)
    cacheTime: 300000,   // 5min
    refetchInterval: false,
    refetchOnWindowFocus: true
  },
  completed: {
    staleTime: 60000,    // 1min (rarely changes)
    cacheTime: 600000,   // 10min
    refetchInterval: false,
    refetchOnWindowFocus: false
  }
};
```

### Pagination Best Practices

```tsx
// Infinite scroll example
function useInfiniteDocuments(status: 'pending' | 'completed') {
  return useInfiniteQuery({
    queryKey: ['documents', status],
    queryFn: ({ pageParam = 0 }) =>
      fetch(`/documents/${status}?page=${pageParam}&limit=20`),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    }
  });
}
```

---

## Frontend Utilities

### Helper Functions

```typescript
// utils/documents.ts

/**
 * Calculate days remaining until deadline
 */
export function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: string | null, isOverdue: boolean): string {
  if (!deadline) return 'No deadline';
  
  const days = getDaysRemaining(deadline);
  
  if (isOverdue) {
    return `Overdue by ${Math.abs(days!)} day${Math.abs(days!) !== 1 ? 's' : ''}`;
  }
  
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days remaining`;
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Determine if user needs to take action
 */
export function needsAction(doc: DocumentListItem): boolean {
  return doc.signedCount < doc.requiredCount;
}

/**
 * Get workflow display text
 */
export function getWorkflowText(mode: string, flow: string): string {
  const modeText = mode === 'INDIVIDUAL' ? 'Individual' : 'Multi-signature';
  const flowText = flow === 'PARALLEL' ? 'Parallel' : 'Sequential';
  return `${modeText} • ${flowText}`;
}
```

### TypeScript Types

```typescript
// types/documents.ts

export interface DocumentListItem {
  id: string;
  title: string;
  status: DocumentStatus;
  signingMode: SigningMode;
  signingFlow: SigningFlow;
  createdAt: string;
  deadline: string | null;
  isOverdue: boolean;
  totalSignatures: number;
  completedSignatures: number;
  signedCount: number;
  requiredCount: number;
}

export type DocumentStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'EXPIRED';

export type SigningMode = 'INDIVIDUAL' | 'MULTI';
export type SigningFlow = 'PARALLEL' | 'SEQUENTIAL';

export interface DocumentListResponse {
  items: DocumentListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DocumentListQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'deadline' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}
```

---

## Error Handling

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**Handling:**
```typescript
try {
  const response = await fetch('/api/documents/pending', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Redirect to login
    redirectToLogin();
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Failed to fetch documents:', error);
  throw error;
}
```

---

## Use Cases

### 1. Dashboard - Action Required Section
Show pending documents that need user's signature:

```tsx
function ActionRequiredDashboard() {
  const { data } = usePendingDocuments(0, 5);
  
  const urgentDocs = data?.items.filter(doc => {
    const days = getDaysRemaining(doc.deadline);
    return days !== null && days <= 3;
  });

  return (
    <Section title="⚠️ Action Required">
      {urgentDocs?.map(doc => (
        <UrgentDocumentCard key={doc.id} doc={doc} />
      ))}
    </Section>
  );
}
```

### 2. Signature History
Show completed documents with download option:

```tsx
function SignatureHistory() {
  const { data } = useCompletedDocuments(0, 20);
  
  return (
    <Table>
      <thead>
        <tr>
          <th>Document</th>
          <th>Completed</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data?.items.map(doc => (
          <tr key={doc.id}>
            <td>{doc.title}</td>
            <td>{formatDate(doc.createdAt)}</td>
            <td>
              {doc.status === 'COMPLETED' ? (
                <Badge variant="success">Fully Completed</Badge>
              ) : (
                <Badge variant="info">
                  Waiting ({doc.completedSignatures}/{doc.totalSignatures})
                </Badge>
              )}
            </td>
            <td>
              <Button onClick={() => viewDetails(doc.id)}>View</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

### 3. Search & Filter
```tsx
function DocumentSearch() {
  const [sortBy, setSortBy] = useState<'createdAt' | 'deadline' | 'title'>('deadline');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  
  const { data } = useQuery({
    queryKey: ['documents', 'pending', sortBy, sortOrder],
    queryFn: () => fetch(`/documents/pending?sortBy=${sortBy}&sortOrder=${sortOrder}`)
  });

  return (
    <div>
      <SortControls>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="deadline">Sort by Deadline</option>
          <option value="createdAt">Sort by Date</option>
          <option value="title">Sort by Title</option>
        </Select>
        
        <ToggleButton 
          onClick={() => setSortOrder(order => order === 'ASC' ? 'DESC' : 'ASC')}
        >
          {sortOrder === 'ASC' ? '↑' : '↓'}
        </ToggleButton>
      </SortControls>

      <DocumentList documents={data?.items} />
    </div>
  );
}
```

---

## Testing

### API Tests

```typescript
describe('User Document List API', () => {
  let token: string;

  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/users/login')
      .send({ email: 'user@test.com', password: 'password' });
    token = response.body.token;
  });

  describe('GET /documents/pending', () => {
    it('should return pending documents only', async () => {
      const response = await request(app)
        .get('/documents/pending')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeLessThanOrEqual(10);
      
      response.body.items.forEach((doc: any) => {
        expect(doc.signedCount).toBeLessThan(doc.requiredCount);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/documents/pending?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/documents/pending?sortBy=deadline&sortOrder=ASC')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deadlines = response.body.items
        .filter((d: any) => d.deadline)
        .map((d: any) => new Date(d.deadline).getTime());
      
      expect(deadlines).toEqual([...deadlines].sort((a, b) => a - b));
    });
  });

  describe('GET /documents/completed', () => {
    it('should return completed documents only', async () => {
      const response = await request(app)
        .get('/documents/completed')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      response.body.items.forEach((doc: any) => {
        expect(doc.signedCount).toBe(doc.requiredCount);
      });
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app)
        .get('/documents/pending')
        .expect(401);
    });
  });
});
```

---

## Migration Guide

### From Old API to New List API

**Old Response (16 fields, ~1.2KB per item):**
```json
{
  "signingProgress": 53,
  "totalSigners": 15,
  "completedSigners": 8,
  "userNeedToSign": true,
  "userCompleted": false,
  "userSignaturesRequired": 3,
  "userSignaturesCompleted": 1,
  "daysRemaining": 7
}
```

**New Response (12 fields, ~0.4KB per item):**
```json
{
  "totalSignatures": 15,
  "completedSignatures": 8,
  "signedCount": 1,
  "requiredCount": 3
}
```

**Migration Steps:**

1. **Replace field names:**
```typescript
// Old
const progress = doc.signingProgress;
const needsAction = doc.userNeedToSign;

// New
const progress = (doc.completedSignatures / doc.totalSignatures) * 100;
const needsAction = doc.signedCount < doc.requiredCount;
```

2. **Calculate derived values:**
```typescript
// daysRemaining removed - calculate client-side
const daysRemaining = doc.deadline 
  ? Math.ceil((new Date(doc.deadline).getTime() - Date.now()) / (1000*60*60*24))
  : null;
```

3. **Update component props:**
```typescript
// Old
<DocumentCard 
  signingProgress={doc.signingProgress}
  userNeedToSign={doc.userNeedToSign}
/>

// New
<DocumentCard 
  progress={(doc.completedSignatures / doc.totalSignatures) * 100}
  needsAction={doc.signedCount < doc.requiredCount}
/>
```

---

## FAQ

### Q: Why does a PENDING document appear in my completed list?
**A:** In SHARED PARALLEL mode, once you complete your signatures, the document moves to your completed list even if other signers haven't finished. Check `doc.status === 'COMPLETED'` to know if the document is fully completed.

### Q: How do I know if I can download the signed file?
**A:** Use the detail API `/documents/:id/completed` to check if `signedFile` is available. It's only available when `status === 'COMPLETED'`.

### Q: Should I use the list API or detail API?
**A:** 
- **List API:** For displaying document lists, dashboards, overviews
- **Detail API:** For document detail pages, signing sessions, full information

### Q: How often should I refetch the pending list?
**A:** Recommended: 30-second stale time with refetch on window focus. Don't use polling unless necessary.

### Q: Can I filter by signing mode or flow?
**A:** Not in the current list API. If you need this, filter on the frontend or use the admin API.

---

## Related Documentation

- [User Document Detail API](./USER_DOCUMENT_DETAIL_API.md) - Full document details for pending/completed views
- [Admin Document Detail API](./ADMIN_DOCUMENT_DETAIL_API.md) - Admin document detail endpoint
- [Admin Document List API](./ADMIN_DOCUMENT_LIST_API.md) - Admin list with advanced filters

---

## Changelog

### v2.0.0 (2026-01-08)
- ✅ Optimized list response from 16 fields to 12 fields (~40% reduction)
- ✅ Changed filter logic to user's completion status (not document status)
- ✅ Removed `daysRemaining` (calculate client-side)
- ✅ Renamed fields: `userSignaturesCompleted` → `signedCount`, `userSignaturesRequired` → `requiredCount`
- ✅ Added `totalSignatures` and `completedSignatures` for overall progress
- ✅ Fixed SHARED PARALLEL mode to correctly categorize completed documents

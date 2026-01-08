# User Document Detail APIs

Tài liệu chi tiết về các API lấy thông tin document dành cho user.

## Tổng quan

User có **2 API riêng biệt** để xem chi tiết document:

| API | Endpoint | Use Case | Response Size |
|-----|----------|----------|---------------|
| **Pending Detail** | `GET /api/documents/:id/pending` | Chuẩn bị ký document | ~2-4KB |
| **Completed Detail** | `GET /api/documents/:id/completed` | Xem lại document đã ký | ~6-10KB |

**Lý do tách 2 API:**
- ✅ Response tối ưu cho từng use case
- ✅ Performance tốt hơn (ít data, ít query)
- ✅ Frontend code đơn giản hơn
- ✅ Caching strategy khác nhau

---

## 1. Pending Document Detail

### Endpoint
```
GET /api/documents/:documentId/pending
```

### Authorization
```
Bearer <JWT_TOKEN>
```
Required roles: `USER`

### Use Case
API này dùng cho **trang chuẩn bị ký document**. User cần biết:
- Document còn zones nào cần ký
- Có thể ký ngay không (`canSignNow`)
- Deadline có quá hạn không
- Tiến độ chung của document

### Request Example
```bash
curl -X GET \
  'https://api.rsign.com/api/documents/123e4567-e89b-12d3-a456-426614174000/pending' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Response Schema
```typescript
{
  document: {
    id: string;
    title: string;
    status: 'PENDING' | 'IN_PROGRESS';
    flow: 'PARALLEL' | 'SEQUENTIAL';
    createdAt: string;          // ISO 8601
    deadline: string;            // ISO 8601
    isOverdue: boolean;          // Calculated
  };
  
  file: string;                  // URL của file gốc
  
  status: {
    totalRequired: number;       // Tổng số chữ ký user cần ký
    completed: number;           // Đã ký bao nhiêu
    pending: number;             // Còn lại bao nhiêu
    canSignNow: boolean;         // Có thể ký ngay không
  };
  
  zones: Array<{
    id: string;
    page: number;
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
    label?: string;
  }>;
  
  progress: {
    current: number;             // Step hiện tại
    total: number;               // Tổng số steps
    percentage: number;          // % hoàn thành (0-100)
  };
  
  currentStepSigners: Array<{   // Người ký cùng step (sequential flow)
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    status: 'PENDING' | 'SIGNED' | 'DECLINED';
  }>;
}
```

### Response Example
```json
{
  "document": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Hợp đồng thuê nhà 2026",
    "status": "IN_PROGRESS",
    "flow": "SEQUENTIAL",
    "createdAt": "2026-01-08T10:00:00Z",
    "deadline": "2026-01-15T23:59:59Z",
    "isOverdue": false
  },
  "file": "https://storage.rsign.com/documents/original-contract.pdf",
  "status": {
    "totalRequired": 2,
    "completed": 1,
    "pending": 1,
    "canSignNow": true
  },
  "zones": [
    {
      "id": "zone-456",
      "page": 2,
      "position": { "x": 100, "y": 200, "w": 150, "h": 50 },
      "label": "Chữ ký bên thuê"
    }
  ],
  "progress": {
    "current": 2,
    "total": 3,
    "percentage": 67
  },
  "currentStepSigners": [
    {
      "user": {
        "id": "user-789",
        "fullName": "Nguyễn Văn B",
        "email": "nguyenvanb@example.com"
      },
      "status": "PENDING"
    }
  ]
}
```

### Error Responses

**403 Forbidden** - User không có quyền truy cập document này
```json
{
  "error": "Forbidden",
  "message": "You don't have access to this document"
}
```

**404 Not Found** - Document không tồn tại
```json
{
  "error": "NotFound",
  "message": "Document not found"
}
```

### Frontend Integration

**React Example:**
```typescript
import { useQuery } from '@tanstack/react-query';

function PendingDocumentPage({ documentId }: { documentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['document', documentId, 'pending'],
    queryFn: () => fetch(`/api/documents/${documentId}/pending`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>{data.document.title}</h1>
      
      {/* Deadline warning */}
      {data.document.isOverdue && (
        <Alert variant="danger">Document đã quá hạn!</Alert>
      )}
      
      {/* Action button */}
      {data.status.canSignNow ? (
        <Button href={`/documents/${documentId}/sign`}>
          Ký ngay ({data.status.pending} chữ ký)
        </Button>
      ) : (
        <Alert>Đang chờ người khác ký xong</Alert>
      )}
      
      {/* Zones to sign */}
      <ZonesList zones={data.zones} fileUrl={data.file} />
      
      {/* Progress */}
      <ProgressBar value={data.progress.percentage} />
    </div>
  );
}
```

### Performance & Caching

**Response Size:** ~2-4KB  
**Response Time:** 50-100ms  
**Recommended Cache TTL:** 3 minutes  

**Caching Strategy:**
```typescript
// Browser cache
Cache-Control: private, max-age=180

// React Query
staleTime: 3 * 60 * 1000 // 3 minutes
```

---

## 2. Completed Document Detail

### Endpoint
```
GET /api/documents/:documentId/completed
```

### Authorization
```
Bearer <JWT_TOKEN>
```
Required roles: `USER`

### Use Case
API này dùng cho **trang xem lại document đã ký xong**. User cần:
- Xem lại chữ ký của mình (preview + playback)
- Xem lịch sử hoạt động (audit trail)
- Download file đã ký
- Verify chữ ký (hash)

### Request Example
```bash
curl -X GET \
  'https://api.rsign.com/api/documents/123e4567-e89b-12d3-a456-426614174000/completed' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Response Schema
```typescript
{
  document: {
    id: string;
    title: string;
    status: 'COMPLETED';
    completedAt: string;         // ISO 8601
    createdAt: string;           // ISO 8601
  };
  
  signedFile: string;            // URL file đã ký
  
  signatures: Array<{
    id: string;
    signedAt: string;            // ISO 8601
    zone: {
      page: number;
      position: {
        x: number;
        y: number;
        w: number;
        h: number;
      };
    } | null;
    signature: {
      previewUrl: string;        // Lazy-loaded SVG preview
      hash: string;              // SHA256 hash
      playback: {                // Data cho animation
        strokes: Array<{
          points: Array<{ x: number; y: number }>;
        }>;
        color: string;
        width: number;
      };
    } | null;
  }>;
  
  activities: Array<{
    type: 'SESSION_CREATED' | 'SIGNATURE_APPLIED' | 'DOCUMENT_VIEWED';
    time: string;                // ISO 8601
    description: string;
  }>;
  
  metadata: {
    totalSigners: number;
    completedSigners: number;
    createdBy: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}
```

### Response Example
```json
{
  "document": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Hợp đồng thuê nhà 2026",
    "status": "COMPLETED",
    "completedAt": "2026-01-08T15:30:00Z",
    "createdAt": "2026-01-08T10:00:00Z"
  },
  "signedFile": "https://storage.rsign.com/documents/signed-contract.pdf",
  "signatures": [
    {
      "id": "sig-123",
      "signedAt": "2026-01-08T12:30:00Z",
      "zone": {
        "page": 2,
        "position": { "x": 100, "y": 200, "w": 150, "h": 50 }
      },
      "signature": {
        "previewUrl": "/api/signatures/sig-123/preview",
        "hash": "sha256:a1b2c3d4e5f6...",
        "playback": {
          "strokes": [
            {
              "points": [
                { "x": 0, "y": 0 },
                { "x": 10, "y": 5 },
                { "x": 20, "y": 10 }
              ]
            }
          ],
          "color": "#000000",
          "width": 2
        }
      }
    }
  ],
  "activities": [
    {
      "type": "SESSION_CREATED",
      "time": "2026-01-08T12:25:00Z",
      "description": "Bắt đầu phiên ký"
    },
    {
      "type": "SIGNATURE_APPLIED",
      "time": "2026-01-08T12:30:00Z",
      "description": "Đã ký trên trang 2"
    }
  ],
  "metadata": {
    "totalSigners": 3,
    "completedSigners": 3,
    "createdBy": {
      "id": "admin-001",
      "fullName": "Nguyễn Quản Trị",
      "email": "admin@example.com"
    }
  }
}
```

### Signature Preview

**Lazy Loading:** SVG preview không được inline trong response, mà được load qua endpoint riêng:

```html
<!-- Simple image tag -->
<img 
  src="/api/signatures/sig-123/preview" 
  alt="Chữ ký"
  loading="lazy"
/>
```

**Preview Endpoint:**
- URL: `GET /api/signatures/:signerId/preview`
- Response: SVG image (`Content-Type: image/svg+xml`)
- Cache: 1 year (`max-age=31536000, immutable`)

### Signature Playback Animation

**Frontend Example:**
```typescript
function SignaturePlayback({ signature }: { signature: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const playAnimation = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const { strokes, color, width } = signature.playback;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Animate each stroke
    strokes.forEach((stroke, i) => {
      setTimeout(() => {
        ctx.beginPath();
        stroke.points.forEach((p, j) => {
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }, i * 200); // 200ms delay between strokes
    });
  };
  
  return (
    <div>
      <canvas ref={canvasRef} width={300} height={150} />
      <button onClick={playAnimation}>▶ Xem lại cách ký</button>
    </div>
  );
}
```

### Error Responses

**403 Forbidden** - User chưa hoàn thành ký hoặc không có quyền
```json
{
  "error": "Forbidden",
  "message": "You haven't completed signing this document yet"
}
```

### Frontend Integration

**React Example:**
```typescript
function CompletedDocumentPage({ documentId }: { documentId: string }) {
  const { data } = useQuery({
    queryKey: ['document', documentId, 'completed'],
    queryFn: () => fetch(`/api/documents/${documentId}/completed`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
    staleTime: 30 * 60 * 1000, // 30 minutes (longer cache)
  });

  return (
    <div>
      <h1>{data.document.title}</h1>
      
      {/* Download button */}
      <Button href={data.signedFile} download>
        📥 Tải file đã ký
      </Button>
      
      {/* Signatures list */}
      <h2>Chữ ký của bạn</h2>
      {data.signatures.map(sig => (
        <SignatureCard key={sig.id}>
          <img 
            src={sig.signature.previewUrl} 
            alt="Chữ ký"
            loading="lazy"
          />
          <SignaturePlayback signature={sig.signature} />
          <div>
            <small>Hash: {sig.signature.hash}</small>
            <small>Ký lúc: {formatDate(sig.signedAt)}</small>
          </div>
        </SignatureCard>
      ))}
      
      {/* Activity timeline */}
      <h2>Lịch sử hoạt động</h2>
      <Timeline activities={data.activities} />
    </div>
  );
}
```

### Performance & Caching

**Response Size:** ~6-10KB (không bao gồm SVG previews)  
**Response Time:** 80-150ms  
**Recommended Cache TTL:** 30 minutes (document đã completed, ít thay đổi)  

**Caching Strategy:**
```typescript
// Browser cache (longer for completed docs)
Cache-Control: private, max-age=1800

// React Query
staleTime: 30 * 60 * 1000 // 30 minutes
```

---

## So sánh 2 APIs

| Feature | Pending API | Completed API |
|---------|-------------|---------------|
| **Use Case** | Chuẩn bị ký | Xem lại đã ký |
| **Response Size** | 2-4KB | 6-10KB |
| **Response Time** | 50-100ms | 80-150ms |
| **Zones** | Chỉ zones cần ký | Zones đã ký |
| **Signature** | ❌ Không có | ✅ Preview + Playback |
| **Activities** | ❌ Không có | ✅ Audit trail |
| **File** | Original | Signed |
| **Cache TTL** | 3 minutes | 30 minutes |

---

## Best Practices

### 1. Routing Logic
```typescript
// Frontend router
function DocumentDetailPage({ id }: { id: string }) {
  const { data: doc } = useQuery(['doc', id]);
  
  // Route based on status
  if (doc.status === 'COMPLETED') {
    return <CompletedDocumentPage documentId={id} />;
  } else {
    return <PendingDocumentPage documentId={id} />;
  }
}
```

### 2. Error Handling
```typescript
const { data, error } = useQuery({
  queryKey: ['document', id, 'pending'],
  queryFn: fetchPending,
  retry: (failureCount, error) => {
    if (error.status === 403) return false; // Don't retry forbidden
    return failureCount < 3;
  }
});

if (error?.status === 403) {
  return <AccessDenied />;
}
```

### 3. Optimistic UI
```typescript
// Khi user ký xong, optimistically update cache
const mutation = useMutation({
  mutationFn: signDocument,
  onSuccess: () => {
    // Invalidate pending cache
    queryClient.invalidateQueries(['document', id, 'pending']);
    // Pre-populate completed cache
    queryClient.setQueryData(['document', id, 'completed'], /* ... */);
  }
});
```

### 4. Prefetching
```typescript
// Prefetch completed data khi user sắp ký xong
if (data.status.pending === 1) {
  queryClient.prefetchQuery({
    queryKey: ['document', id, 'completed'],
    queryFn: fetchCompleted,
  });
}
```

---

## Migration Guide

Nếu bạn đang dùng API cũ `GET /api/documents/:id/details`:

### Before
```typescript
const { data } = useQuery(['document', id]);
// Response chứa cả pending + completed data (8-12KB)
```

### After
```typescript
// Tách thành 2 calls riêng
const isPending = status !== 'COMPLETED';

const { data } = useQuery({
  queryKey: ['document', id, isPending ? 'pending' : 'completed'],
  queryFn: () => isPending 
    ? fetchPending(id) 
    : fetchCompleted(id)
});
```

**Benefits:**
- ⚡ Response nhỏ hơn 60-70%
- 🎯 Chỉ fetch data cần thiết
- 💾 Cache strategy tối ưu hơn

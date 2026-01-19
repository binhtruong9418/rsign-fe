# User Frontend Integration Guide

> **API Base URL:** `http://localhost:5531/api`  
> **Auth:** Bearer Token (JWT) - Role: `USER`

---

## ❌ Decline Signature

### Endpoint

```
POST /api/documents/:documentId/decline
```

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

```typescript
{
    reason: string; // Required, 10-500 characters
}
```

### Response Success

```json
{
    "success": true,
    "declinedCount": 3,
    "documentSignerIds": ["signer-uuid-1", "signer-uuid-2", "signer-uuid-3"]
}
```

**Note:** `declinedCount` là số lượng chữ ký bị từ chối (user có thể có nhiều zones trong 1 document)

### Response Errors

```json
// 400 - No pending signatures
{
  "success": false,
  "error": "NO_PENDING_SIGNATURES",
  "message": "No pending signatures found for this document",
  "statusCode": 400
}

// 400 - Reason too short
{
  "success": false,
  "message": "Validation error",
  "errors": [{
    "path": "/reason",
    "message": "Expected string with minimum length of 10"
  }],
  "statusCode": 400
}
```

---

## UI Implementation

### 1. Decline Modal Component

```tsx
import { useState } from "react";

interface DeclineModalProps {
    documentId: string;
    documentTitle: string;
    onSuccess?: () => void;
}

export const DeclineModal = ({
    documentId,
    documentTitle,
    onSuccess,
}: DeclineModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate
        if (reason.length < 10) {
            setError("Reason must be at least 10 characters");
            return;
        }

        if (reason.length > 500) {
            setError("Reason must be less than 500 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/documents/${documentId}/decline`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            const data = await response.json();

            // Success
            alert(`Successfully declined ${data.declinedCount} signature(s)`);
            setIsOpen(false);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || "Failed to decline");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50">
                <XCircle className="inline mr-2" />
                Decline
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            Decline Signature
                        </h2>

                        {/* Warning */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                            <p className="text-sm">
                                ⚠️ You are declining:{" "}
                                <strong>{documentTitle}</strong>
                            </p>
                            <p className="text-sm mt-1">
                                This action cannot be undone and will notify the
                                sender.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <label className="block mb-2 font-medium">
                                Reason for declining{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border rounded p-3 min-h-[120px]"
                                placeholder="Please provide a reason (minimum 10 characters)..."
                                maxLength={500}
                                required
                            />

                            <div className="flex justify-between items-center mt-1">
                                {error && (
                                    <span className="text-red-500 text-sm">
                                        {error}
                                    </span>
                                )}
                                <span
                                    className={`text-xs ml-auto ${
                                        reason.length < 10
                                            ? "text-red-500"
                                            : reason.length > 450
                                              ? "text-orange-500"
                                              : "text-gray-500"
                                    }`}>
                                    {reason.length}/500
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded"
                                    disabled={loading}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                    disabled={loading || reason.length < 10}>
                                    {loading
                                        ? "Declining..."
                                        : "Confirm Decline"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
```

### 2. Document Detail Page Integration

```tsx
const DocumentDetailPage = ({ documentId }: { documentId: string }) => {
    const { data: document, refetch } = useQuery({
        queryKey: ["document", documentId],
        queryFn: () => fetchDocument(documentId),
    });

    // Check if user has pending signatures
    const mySignatures = document?.steps
        .flatMap((step) => step.signers)
        .filter((signer) => signer.user.id === currentUserId);

    const hasPending = mySignatures?.some((s) => s.status === "PENDING");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold">{document?.title}</h1>
                    <p className="text-gray-600">
                        From: {document?.createdBy?.fullName}
                    </p>
                </div>

                {/* Action Buttons */}
                {hasPending && (
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                            onClick={handleSign}>
                            Sign Document
                        </button>

                        <DeclineModal
                            documentId={documentId}
                            documentTitle={document.title}
                            onSuccess={() => {
                                refetch();
                                navigate("/documents/pending");
                            }}
                        />
                    </div>
                )}
            </div>

            {/* My Signatures Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="font-semibold text-lg mb-4">
                    Your Signing Status
                </h2>

                <div className="space-y-3">
                    {mySignatures?.map((sig, idx) => (
                        <div key={idx} className="border rounded p-3">
                            <div className="flex justify-between items-center">
                                <span>Signature #{idx + 1}</span>
                                <StatusBadge status={sig.status} />
                            </div>

                            {sig.status === "DECLINED" && sig.declineReason && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                                    <p className="font-medium">You declined:</p>
                                    <p className="mt-1">{sig.declineReason}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(sig.declinedAt)}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Document Preview */}
            <DocumentViewer url={document?.originalFileUrl} />
        </div>
    );
};
```

### 3. Simple Alternative (Using Browser Dialog)

```tsx
const handleDecline = async () => {
    const reason = prompt(
        "Please provide a reason for declining (minimum 10 characters):"
    );

    if (!reason) return;

    if (reason.length < 10) {
        alert("Reason must be at least 10 characters");
        return;
    }

    if (
        !confirm(
            `Confirm decline?\n\nReason: ${reason}\n\nThis cannot be undone.`
        )
    ) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/documents/${documentId}/decline`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }),
            }
        );

        if (!response.ok) throw new Error("Failed to decline");

        const data = await response.json();
        alert(`Successfully declined ${data.declinedCount} signature(s)`);
        window.location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
};

// Usage
<button onClick={handleDecline}>Decline Document</button>;
```

---

## Validation

### Client-side Validation

```typescript
const validateReason = (reason: string): string | null => {
    if (!reason || reason.trim().length === 0) {
        return "Reason is required";
    }

    if (reason.length < 10) {
        return "Reason must be at least 10 characters";
    }

    if (reason.length > 500) {
        return "Reason must not exceed 500 characters";
    }

    return null; // Valid
};
```

### Real-time Character Counter

```tsx
const CharacterCounter = ({ value }: { value: string }) => {
    const getColor = () => {
        if (value.length < 10) return "text-red-500";
        if (value.length > 450) return "text-orange-500";
        return "text-gray-500";
    };

    return (
        <span className={`text-xs ${getColor()}`}>
            {value.length}/500 characters
            {value.length < 10 && " (minimum 10)"}
        </span>
    );
};
```

---

## Error Handling

```typescript
const handleDeclineError = (error: any) => {
    const message = error.response?.data?.message || error.message;

    if (message.includes("NO_PENDING_SIGNATURES")) {
        return "You have no pending signatures for this document";
    }

    if (message.includes("minimum length")) {
        return "Reason must be at least 10 characters";
    }

    if (message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return "Session expired. Please login again";
    }

    return message || "Failed to decline signature";
};
```

---

## TypeScript Types

```typescript
interface DeclineRequest {
    reason: string;
}

interface DeclineResponse {
    success: true;
    declinedCount: number;
    documentSignerIds: string[];
}

interface DocumentSigner {
    id: string;
    user: {
        id: string;
        fullName: string;
        email: string;
    };
    status: "WAITING" | "PENDING" | "SIGNED" | "DECLINED";
    signedAt?: string;
    declinedAt?: string;
    declineReason?: string;
}
```

---

## Best Practices

### 1. User Confirmation

Always confirm before declining:

```tsx
const confirmed = await confirmDialog({
    title: "Decline Signature",
    message:
        "Are you sure you want to decline this document? This action cannot be undone.",
    confirmText: "Yes, Decline",
    cancelText: "Cancel",
});

if (!confirmed) return;
```

### 2. Clear Feedback

```tsx
// Success
toast.success(`Successfully declined ${data.declinedCount} signature(s)`, {
    duration: 5000,
});

// Error
toast.error(handleDeclineError(error), { duration: 7000 });
```

### 3. Redirect After Decline

```tsx
onSuccess: () => {
    // Refresh list
    queryClient.invalidateQueries(["documents"]);

    // Show message
    toast.success("Document declined successfully");

    // Redirect
    navigate("/documents/pending");
};
```

### 4. Disable During Loading

```tsx
<button
    disabled={isLoading || reason.length < 10}
    className={isLoading ? "opacity-50 cursor-not-allowed" : ""}>
    {isLoading ? "Declining..." : "Decline"}
</button>
```

---

## Testing Checklist

- [ ] Validate minimum 10 characters
- [ ] Validate maximum 500 characters
- [ ] Show character count real-time
- [ ] Disable submit when invalid
- [ ] Show confirmation dialog
- [ ] Handle success response
- [ ] Show success toast/message
- [ ] Redirect after success
- [ ] Handle "no pending signatures" error
- [ ] Handle validation errors
- [ ] Handle network errors
- [ ] Handle 401 (logout & redirect)
- [ ] Loading state during API call
- [ ] Disable form during loading

---

## Example Integration (React Query)

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeclineSignature = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            documentId,
            reason,
        }: {
            documentId: string;
            reason: string;
        }) => {
            const response = await fetch(
                `${API_URL}/api/documents/${documentId}/decline`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            return response.json();
        },
        onSuccess: (data, variables) => {
            // Invalidate queries
            queryClient.invalidateQueries(["documents"]);
            queryClient.invalidateQueries(["document", variables.documentId]);

            // Show success
            toast.success(
                `Successfully declined ${data.declinedCount} signature(s)`
            );
        },
        onError: (error: Error) => {
            toast.error(handleDeclineError(error));
        },
    });
};

// Usage in component
const { mutate, isLoading } = useDeclineSignature();

const handleDecline = () => {
    mutate({ documentId, reason });
};
```

---

## Support

- **Swagger:** http://localhost:5531/swagger-ui
- **Backend Team:** backend-team@example.com

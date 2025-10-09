
export interface User {
    id: number;
    email: string;
    fullName?: string;
}

export interface Document {
    id: number;
    title: string;
    content?: string;
    createdAt: string;
    updatedAt: string;
    signingToken: string | null;
    signature: Signature;
    signingTokenExpires: string | null;
    signedAt: string | null;
    deadline: string | null;
    status: string;
    fileUrl?: string;
    competentAuthority: string;
}

export interface Signature {
    id: string;
    user: User;
    signatureData: {
      strokes: Stroke[];
      timestamp: string;
      expiresAt: string;
      documentHash: string;
      color: string;
      width: number;
    };
    createdAt: string;
}

export interface Point {
    x: number;
    y: number;
    timestamp: number;
}

export interface Stroke {
    id: string;
    points: Point[];
}
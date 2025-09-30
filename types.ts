
export interface User {
    id: number;
    email: string;
}

export interface Document {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    signing_token: string | null;
    signatures: Signature[];
    signing_token_expires: string | null;
    signed_at: string | null;
    deadline: string | null;
}

export interface Signature {
    id: string;
    user: User;
    signature_data: {
      strokes: Stroke[];
      timestamp: string;
      expires_at: string;
      document_hash: string;
    };
    signed_at: string;
}

export interface Point {
    x: number;
    y: number;
    timestamp: number;
}

export interface Stroke {
    id: string;
    color: string;
    points: Point[];
    width: number;
}
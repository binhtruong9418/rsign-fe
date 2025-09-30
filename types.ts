
export interface User {
  id: string;
  email: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Signature {
  id: string;
  documentId: string;
  userId: string;
  user: User;
  signatureData: string;
  signedAt: string;
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
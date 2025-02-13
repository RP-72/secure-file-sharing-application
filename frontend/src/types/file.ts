export interface SharedWithUser {
  id: string;
  email: string;
}

export interface FileType {
  id: string;
  name: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  url: string;
  shared_with?: SharedWithUser[];
  owner: {
    id: string;
    email: string;
  };
} 
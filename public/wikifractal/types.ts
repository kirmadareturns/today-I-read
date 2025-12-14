export interface WikiNode {
  id: string;
  title: string;
  content: string | null;
  loading: boolean;
  error: string | null;
  children: WikiNode[];
  parentId?: string;
}

export interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

export interface SearchResult {
  title: string;
  description: string;
}
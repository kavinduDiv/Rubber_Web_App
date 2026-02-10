export interface Tree {
  id?: number;
  tree_id: string; // User-facing ID (e.g., "T-101")
  lat: number;
  lng: number;
  note?: string;   // Description or location details
  created_at: string; // ISO String
  synced: number; // 0 = unsynced, 1 = synced
}

export interface Collection {
  id?: number;
  tree_id: string;
  cuts: number;
  milk_amount: number;
  note?: string;
  timestamp: string; // ISO String
  synced: number; // 0 = unsynced, 1 = synced
}

export interface TreeData extends Tree {
  collections?: Collection[];
}

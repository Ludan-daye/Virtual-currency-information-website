export interface NfpItem {
  month: string;
  actual: number;
  forecast: number;
  previous: number;
}

export interface NfpResponse {
  updatedAt: string;
  items: NfpItem[];
}

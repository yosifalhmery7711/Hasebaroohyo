export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'calculator' | 'converter' | 'health' | 'ai';
  title: string;
  details: string;
  result: string;
}

export interface AIMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export type UnitType = 'mass' | 'volume' | 'distance';

export interface Unit {
  label: string;
  value: string;
  factor: number; // Factor relative to a base unit
}

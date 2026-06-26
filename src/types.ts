export interface AgentCard {
  id: string;
  name: string;
  role: string;
  description: string;
  endpoints: {
    rpc: string;
    card: string;
  };
  authentication: string[];
  skills: string[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  brand: string;
  model: string;
  size: string;
  stock: number;
  price: number;
  category: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'A2A_IN' | 'A2A_OUT' | 'MCP_SYNC' | 'AP2_AUTH';
  message: string;
  details?: any;
}

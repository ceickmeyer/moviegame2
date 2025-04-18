// lib/utils/dataHelpers.ts
export function ensureArray(value: any): any[] {
    if (!value) return [];
    
    if (Array.isArray(value)) return value;
    
    if (typeof value === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (e) {
        // If it's not valid JSON, split by comma
        return value.split(',').map(item => item.trim());
      }
    }
    
    if (typeof value === 'object') {
      // Check if it's a PostgreSQL JSONB array (objects with numeric keys)
      const keys = Object.keys(value);
      const isNumericKeysOnly = keys.every(key => !isNaN(Number(key)));
      
      if (isNumericKeysOnly) {
        return Object.values(value);
      }
      
      return [value];
    }
    
    return [value];
  }
  
  // Function to safely parse JSONB fields from Supabase
  export function parseJsonbField(value: any): any[] {
    if (!value) return [];
    
    // If already an array, return it
    if (Array.isArray(value)) return value;
    
    // If it's a string, try to parse it
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [value];
      }
    }
    
    // If it's an object, convert to array
    if (typeof value === 'object') {
      // Check if it's PostgreSQL JSONB array (keys are "0", "1", etc.)
      const numericKeys = Object.keys(value).every(key => /^\d+$/.test(key));
      if (numericKeys) {
        return Object.values(value);
      }
      return [value];
    }
    
    return [value];
  }
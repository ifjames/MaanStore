# Inventory Edit Issue Fix

## Problem
When trying to edit an inventory item, the application was throwing an error:
```
Update failed. No document to update: projects/maanstore-b6ea0/databases/(default)/documents/inventory/NaN
```

## Root Cause
The issue was caused by an ID conversion problem between the frontend schema and Firestore database:

1. **Firestore document IDs**: Firestore uses string IDs (e.g., "abc123", "xyz789")
2. **Frontend schema**: The `Inventory` interface expects numeric IDs (`id: number`)
3. **Adapter function**: Was trying to convert string IDs to numbers using `parseInt(item.id || '0')`
4. **Conversion failure**: When Firestore IDs weren't numeric, `parseInt()` returned `NaN`
5. **Edit operation**: The edit modal was calling `item.id.toString()` which became `"NaN"`

## Solution
Fixed the issue with a two-part approach:

### 1. Updated Edit Modal (`edit-inventory-modal.tsx`)
- Instead of using the converted numeric ID, find the actual Firestore document ID
- Match the item by `itemName` to locate the correct Firestore document
- Use the original string ID for the update operation
- Added better error handling and debugging logs

```tsx
// Find the actual Firestore document ID
const firestoreItems = await inventoryService.getAll();
const firestoreItem = firestoreItems.find(fi => fi.itemName === item.itemName);

if (!firestoreItem || !firestoreItem.id) {
  throw new Error(`Item "${item.itemName}" not found in database`);
}

// Use the original Firestore string ID
return await inventoryService.update(firestoreItem.id, updateData);
```

### 2. Improved Adapter Function (`inventory.tsx`)
- Added a hash function to handle non-numeric Firestore IDs gracefully
- Instead of defaulting to 0, use a hash of the string ID to create a consistent numeric ID
- This prevents `NaN` values from being generated

```tsx
const hashCode = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const adaptInventoryItem = (item: InventoryItem): Inventory => ({
  id: item.id ? (parseInt(item.id) || hashCode(item.id)) : 0,
  // ... rest of the fields
});
```

## Files Modified
1. `/client/src/components/inventory/edit-inventory-modal.tsx`
2. `/client/src/pages/inventory.tsx`

## Testing
To test the fix:
1. Start the development server: `npm run dev`
2. Navigate to the inventory page
3. Try editing an inventory item
4. The update should work without the "NaN" error

## Why This Happened
This is a common issue when working with different data storage systems that have different ID formats. Firestore uses string-based document IDs, while many frontend schemas prefer numeric IDs for simplicity. The key is to maintain a mapping between the two or use the original format when communicating with the backend.

## Prevention
- Consider using string IDs throughout the frontend to match Firestore
- Or maintain a separate mapping between frontend numeric IDs and Firestore string IDs
- Always validate ID conversions and handle edge cases
- Add comprehensive logging for debugging ID-related issues

# Low Stock Threshold Settings - Test Guide

## Overview
The low stock threshold setting allows users to customize when items are considered "low stock" across the entire application.

## How to Test

### 1. Access Settings
1. Navigate to Settings page
2. Look for "System" section with "Low Stock Threshold" setting
3. Options available: 5, 10, 15, 20 items

### 2. Change Threshold
1. Select a different threshold (e.g., change from 10 to 15)
2. Click "Save Settings"
3. Should see success toast notification

### 3. Verify Dashboard Updates
1. Go to Dashboard
2. Check "Low Stock Alerts" section header
3. Should show "≤ 15 threshold" (or whatever you selected)
4. Low stock count should update based on new threshold
5. Items shown in alerts should match new threshold

### 4. Verify Inventory Table
1. Go to Inventory page
2. Look at the "Status" column
3. Items with stock ≤ your threshold should show "Low Stock"
4. Items above threshold should show "In Stock"

### 5. Verify Public Page
1. Navigate to public inventory (if accessible)
2. Stock status should also respect the new threshold

### 6. Test Persistence
1. Change threshold and save
2. Refresh the page
3. Go back to Settings
4. Should remember your choice
5. Dashboard and inventory should still use the saved threshold

## Expected Behavior

### Before Setting Change (default = 10)
- Items with stock ≤ 10 show as "Low Stock"
- Dashboard shows "≤ 10 threshold"

### After Changing to 15
- Items with stock ≤ 15 show as "Low Stock" 
- Dashboard shows "≤ 15 threshold"
- More items may appear in low stock alerts
- Settings page shows 15 as selected

### After Changing to 5
- Only items with stock ≤ 5 show as "Low Stock"
- Dashboard shows "≤ 5 threshold"  
- Fewer items in low stock alerts
- Settings page shows 5 as selected

## Technical Details

### Files Modified
- `client/src/lib/settings.ts` - Settings utility
- `client/src/pages/settings.tsx` - Settings UI
- `client/src/pages/dashboard.tsx` - Dashboard integration
- `client/src/components/inventory/inventory-table.tsx` - Inventory table
- `client/src/pages/public-inventory.tsx` - Public page

### Storage
- Settings stored in localStorage as JSON
- Key: `maans-store-settings`
- Legacy migration from old `lowStockThreshold` key

### Query Cache
- Dashboard queries include threshold in key for proper cache invalidation
- Settings page invalidates relevant queries when saving

## Troubleshooting

### Threshold Not Updating
1. Check browser localStorage for `maans-store-settings`
2. Verify Save Settings button was clicked
3. Check for JavaScript console errors

### Dashboard Not Reflecting Changes
1. Hard refresh the page (Ctrl+F5)
2. Check if queries are being invalidated
3. Look for threshold value in query keys

### Settings Not Persisting
1. Check if localStorage is working in browser
2. Verify no storage quota issues
3. Check browser developer tools for errors

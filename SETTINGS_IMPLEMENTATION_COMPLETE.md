# Low Stock Threshold Settings Implementation

## Overview
Successfully implemented a configurable low stock threshold system that allows users to customize when items are considered "low stock" throughout the entire Maans' Store application.

## Features Implemented

### 1. Settings Management System
- **Location**: `client/src/lib/settings.ts`
- **Purpose**: Centralized settings management with localStorage persistence
- **Features**:
  - Type-safe settings interface
  - Default settings fallback
  - Individual setting getters/setters
  - Legacy settings migration
  - Error handling for localStorage issues

### 2. Settings UI
- **Location**: `client/src/pages/settings.tsx`
- **Features**:
  - Dropdown selector with options: 5, 10, 15, 20 items
  - Live preview showing what the threshold means
  - Save button with success/error feedback
  - Integration with query cache invalidation
  - Responsive design matching app theme

### 3. Reactive Settings Hook
- **Location**: `client/src/hooks/use-settings.ts`
- **Features**:
  - React hook for reactive settings updates
  - Cross-tab synchronization via storage events
  - Specialized hook for low stock threshold
  - Type-safe setting updates

### 4. Dashboard Integration
- **Location**: `client/src/pages/dashboard.tsx`
- **Features**:
  - Uses user's custom threshold for low stock calculations
  - Displays current threshold in UI (e.g., "≤ 15 threshold")
  - Reactive updates when settings change
  - Proper query cache keys for threshold-based data

### 5. Inventory Table Integration
- **Location**: `client/src/components/inventory/inventory-table.tsx`
- **Features**:
  - Stock status badges respect user's threshold
  - Real-time updates when threshold changes
  - Consistent "Low Stock" vs "In Stock" labeling

### 6. Public Inventory Integration
- **Location**: `client/src/pages/public-inventory.tsx`
- **Features**:
  - Public page also respects the threshold setting
  - Consistent availability status across all views

## Technical Implementation

### Settings Storage
```typescript
interface UserSettings {
  lowStockThreshold: number;
  theme: string;
  currency: string;
  notifications: boolean;
}
```

### Storage Key
- **Primary**: `maans-store-settings` (JSON object)
- **Legacy**: `lowStockThreshold` (migrated automatically)

### Query Cache Integration
- Dashboard stats: `["inventory-stats", lowStockThreshold]`
- Low stock items: `["low-stock-items", lowStockThreshold]`
- Automatic invalidation when settings change

### Default Values
- **Low Stock Threshold**: 10 items
- **Theme**: system
- **Currency**: PHP
- **Notifications**: true

## User Experience

### Settings Flow
1. User navigates to Settings page
2. Sees current threshold in dropdown
3. Can change to 5, 10, 15, or 20 items
4. Preview shows what the change means
5. Click "Save Settings" to apply
6. Toast notification confirms success
7. Dashboard and inventory immediately reflect changes

### Visual Indicators
- **Dashboard**: Shows "≤ X threshold" badge
- **Inventory Table**: "Low Stock" badge for items ≤ threshold
- **Settings Preview**: Explains what threshold means
- **Save Feedback**: Success/error toast notifications

## Persistence & Migration

### Legacy Migration
```typescript
// Automatically migrates old localStorage keys
migrateLegacySettings();
```

### Cross-Tab Sync
- Changes in one tab automatically update other tabs
- Uses storage events for real-time synchronization

### Error Handling
- Graceful fallback to defaults if localStorage fails
- User-friendly error messages for save failures
- Console warnings for debugging

## Testing

### Manual Testing Steps
1. Change threshold in settings (5 → 15)
2. Verify dashboard shows new threshold
3. Check inventory table stock statuses
4. Refresh page - settings should persist
5. Open new tab - should sync automatically

### Files to Test
- Settings page functionality
- Dashboard low stock alerts
- Inventory table status badges
- Cross-tab synchronization
- Page refresh persistence

## Files Modified/Created

### New Files
- `client/src/lib/settings.ts` - Settings utility
- `client/src/hooks/use-settings.ts` - React hooks
- `LOW_STOCK_SETTINGS_TEST.md` - Test guide

### Modified Files
- `client/src/pages/settings.tsx` - Settings UI
- `client/src/pages/dashboard.tsx` - Dashboard integration
- `client/src/components/inventory/inventory-table.tsx` - Table integration
- `client/src/pages/public-inventory.tsx` - Public page integration

## Benefits

1. **User Control**: Users can customize thresholds based on their business needs
2. **Consistency**: Same threshold used across all parts of the application
3. **Persistence**: Settings survive page refreshes and browser restarts
4. **Reactivity**: Changes immediately reflect throughout the app
5. **Extensibility**: Framework ready for additional settings
6. **Type Safety**: Full TypeScript integration with proper types

## Future Enhancements

Possible future additions to the settings system:
- Currency selection
- Notification preferences
- Auto-refresh intervals
- Export formats
- Language selection
- Custom categories
- Alert email settings

The foundation is now in place to easily add any of these additional settings using the same pattern.

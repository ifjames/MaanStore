/**
 * Debug utility for MaanStore application
 * 
 * 🔧 HOW TO USE:
 * 
 * 1. Enable debug logging:
 *    Open browser console and run: enableDebug()
 *    OR: localStorage.setItem('DEBUG', 'true'); location.reload();
 * 
 * 2. Disable debug logging:
 *    Open browser console and run: disableDebug()
 *    OR: localStorage.removeItem('DEBUG'); location.reload();
 * 
 * 3. Check debug status:
 *    Open browser console and run: debugInfo()
 * 
 * 📋 WHAT GETS LOGGED:
 * - [Inventory] Search processing and filtering
 * - [InventoryTable] Table rendering details
 * - [ExcelUpload] File parsing and data processing
 * - [EditInventoryModal] Item update operations
 * - [InventoryFixed] Alternative search implementation
 * - [AppInit] Application initialization steps
 * 
 * 🎯 PRODUCTION SAFE:
 * - Debug logs only appear when explicitly enabled
 * - No performance impact in production
 * - Clean console output when DEBUG=false
 */

// Check if debug mode is enabled
export const DEBUG = process.env.NODE_ENV === 'development' && 
  (typeof window !== 'undefined' && localStorage.getItem('DEBUG') === 'true');

// Debug logging function
export const debugLog = (module: string, ...args: any[]) => {
  if (DEBUG) {
    console.log(`[${module}]`, ...args);
  }
};

// Debug info function for showing current state
export const debugInfo = () => {
  if (typeof window !== 'undefined') {
    console.log('🔧 Debug Mode:', DEBUG ? 'ENABLED ✅' : 'DISABLED ❌');
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 DEBUG localStorage:', localStorage.getItem('DEBUG'));
    console.log('');
    console.log('📝 To enable debug mode:');
    console.log('   localStorage.setItem("DEBUG", "true"); location.reload();');
    console.log('📝 To disable debug mode:');
    console.log('   localStorage.removeItem("DEBUG"); location.reload();');
  }
};

// Auto-expose debug functions to window for easy access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugInfo = debugInfo;
  (window as any).enableDebug = () => {
    localStorage.setItem('DEBUG', 'true');
    console.log('🔧 Debug mode enabled! Refreshing page...');
    location.reload();
  };
  (window as any).disableDebug = () => {
    localStorage.removeItem('DEBUG');
    console.log('🔧 Debug mode disabled! Refreshing page...');
    location.reload();
  };
}

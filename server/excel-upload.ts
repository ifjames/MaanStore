import * as XLSX from 'xlsx';
import type { InsertInventory } from '@shared/schema';
import type { IStorage } from './storage';

export class ExcelUploadService {
  parseExcelFile(buffer: Buffer): Promise<InsertInventory[]> {
    return new Promise((resolve, reject) => {
      try {
        console.log('📊 Parsing Excel file...');
        
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        console.log('📋 Available sheets:', workbook.SheetNames);
        
        let sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('inv') || 
          name.toLowerCase().includes('april') ||
          name.toLowerCase().includes('2025')
        ) || workbook.SheetNames[0];
        
        console.log('📄 Using sheet:', sheetName);
        const worksheet = workbook.Sheets[sheetName];
        
        // Get raw sheet data with different parsing options
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
        console.log('📋 Found', rawData.length, 'rows in Excel file');
        
        // Also try getting data with raw values
        const rawDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
        
        // Also get the range to understand the actual dimensions
        const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
        console.log('📏 Sheet range:', worksheet['!ref'], '- Rows:', range.e.r + 1, 'Cols:', range.e.c + 1);
        
        console.log('🔍 First 5 rows structure (formatted):');
        (rawData as any[][]).slice(0, 5).forEach((row, index) => {
          console.log('Row', index + 1, ':', row.slice(0, 8));
        });
        
        console.log('🔍 First 5 rows structure (raw):');
        (rawDataRaw as any[][]).slice(0, 5).forEach((row, index) => {
          console.log('Row', index + 1, ' (raw):', row.slice(0, 8));
        });
        
        // Let's also look at a few more rows to understand the structure
        console.log('🔍 Rows 6-10 structure:');
        (rawData as any[][]).slice(5, 10).forEach((row, index) => {
          console.log('Row', index + 6, ':', row.slice(0, 8));
        });
        
        const inventoryData = this.parseSheetData(rawData as any[][]);
        
        // If the standard parsing didn't find any items, try alternative approach
        if (inventoryData.length === 0) {
          console.log('🔄 Standard parsing found no items, trying alternative approach...');
          const alternativeData = this.parseSheetDataAlternative(rawData as any[][]);
          if (alternativeData.length > 0) {
            console.log('✅ Alternative parsing found', alternativeData.length, 'items');
            resolve(alternativeData);
            return;
          }
        }
        
        console.log('✅ Successfully parsed', inventoryData.length, 'inventory items');
        resolve(inventoryData);
        
      } catch (error) {
        console.error('❌ Error parsing Excel file:', error);
        reject(new Error('Failed to parse Excel file'));
      }
    });
  }

  private parseSheetData(rows: any[][]): InsertInventory[] {
    const inventoryData: InsertInventory[] = [];
    let currentCategory = 'General';
    
    console.log('🔍 Starting to parse sheet data...');
    console.log('📋 Expected structure: Category rows, then header row, then product rows');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || row.length === 0) {
        console.log('Row', i + 1, ': Empty row, skipping');
        continue;
      }
      
      // Get the first cell content
      const firstCell = row[0]?.toString()?.trim();
      if (!firstCell) continue;
      
      console.log('Row', i + 1, ': Checking "' + firstCell + '" | Full row:', row.slice(0, 4));
      
      // Check if this is a category header
      if (this.isCategoryHeader(firstCell)) {
        currentCategory = this.extractCategoryName(firstCell);
        console.log('📂 Found category:', currentCategory);
        continue;
      }
      
      // Check if this is a table header row
      if (this.isHeaderRow(firstCell)) {
        console.log('⏭️ Skipping table header row');
        continue;
      }
      
      // This should be a product row
      // In your structure: Column A = Product name, Column B = Price, Column C = Stock
      const productName = firstCell;
      const priceValue = row[1];
      
      // Skip if no price
      if (!priceValue) {
        console.log('⚠️ Skipped (no price):', productName);
        continue;
      }
      
      // Parse the price
      let price = '0.00';
      const cleanPrice = priceValue.toString().replace(/[₱,$,]/g, '').trim();
      const priceNum = parseFloat(cleanPrice);
      if (!isNaN(priceNum) && priceNum > 0) {
        price = priceNum.toFixed(2);
      }
      
      if (parseFloat(price) > 0) {
        const inventoryItem: InsertInventory = {
          itemName: productName,
          price: price,
          stock: 100,
          category: currentCategory,
        };
        
        inventoryData.push(inventoryItem);
        console.log('✅ Added:', productName, '- ₱' + price, '(' + currentCategory + ')');
      } else {
        console.log('⚠️ Skipped (invalid price):', productName, '(price value: "' + priceValue + '")');
      }
    }
    
    return inventoryData;
  }

  private parseSheetDataAlternative(rows: any[][]): InsertInventory[] {
    const inventoryData: InsertInventory[] = [];
    let currentCategory = 'General';
    
    console.log('🔄 Trying alternative parsing approach...');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      // Check columns for category, product name, and price
      const categoryName = row[0]?.toString()?.trim();
      const productName = row[1]?.toString()?.trim();
      const priceValue = row[2]?.toString()?.trim();
      
      if (!productName) continue;
      
      // Skip header rows
      if (this.isHeaderRow(productName) || this.isHeaderRow(categoryName || '')) {
        console.log('⏭️ Skipping header row (alternative)');
        continue;
      }
      
      // Update category if we have a valid category name
      if (categoryName && this.isCategoryHeader(categoryName)) {
        currentCategory = this.extractCategoryName(categoryName);
        console.log('📂 Updated category to (alternative):', currentCategory);
      }
      
      // Parse the price
      if (!priceValue) continue;
      const priceNum = parseFloat(priceValue);
      if (isNaN(priceNum) || priceNum <= 0) continue;
      
      const price = priceNum.toFixed(2);
      
      const inventoryItem: InsertInventory = {
        itemName: productName,
        price: price,
        stock: 100,
        category: currentCategory,
      };
      
      inventoryData.push(inventoryItem);
      console.log('✅ Added (alternative):', productName, '- ₱' + price, '(' + currentCategory + ')');
    }
    
    return inventoryData;
  }

  private isCategoryHeader(text: string): boolean {
    const categoryIndicators = [
      'ALCOHOLIC AND BEVERAGES',
      'CIGARETS',
      'JUICES RTD & DAIRY + POWDER',
      'WINE AND RUM',
      'CAN FOODS',
      'SEASONING',
      'FOOD ADDITIVES',
      'NOODLES + VEGETABLE GRAIN',
      'JUNK FOOD - SITSIRYA',
      'PERSONAL HYGIENE ITEMS',
      'DETERGENTS',
      'BREAD AND COOKIES',
      'RICE',
      'OTHER FOODS',
      'COFFEE',
      'OTHER ITEMS'
    ];
    
    const upperText = text.toUpperCase();
    return categoryIndicators.some(indicator => 
      upperText.includes(indicator)
    );
  }

  private isHeaderRow(text: string): boolean {
    const headerIndicators = [
      'Product - Items',
      'PRODUCT - ITEMS',
      'Retail Price',
      'RETAIL PRICE',
      'Stocks',
      'STOCKS'
    ];
    
    return headerIndicators.some(indicator => 
      text.toUpperCase() === indicator.toUpperCase()
    );
  }

  private extractCategoryName(text: string): string {
    const categoryMappings: { [key: string]: string } = {
      'ALCOHOLIC AND BEVERAGES': 'Alcoholic and Beverages',
      'CIGARETS': 'Cigarettes',
      'JUICES RTD & DAIRY + POWDER': 'Juices RTD & Dairy + Powder',
      'WINE AND RUM': 'Alcohol and Beer',
      'ALCOHOL AND BEER': 'Alcohol and Beer',
      'CAN FOODS': 'Can Foods',
      'SEASONING': 'Seasoning',
      'FOOD ADDITIVES': 'Food Additives',
      'NOODLES + VEGETABLE GRAIN': 'Noodles + Vegetable Grain',
      'JUNK FOOD - SITSIRYA': 'Junk Food - Sitsirya',
      'PERSONAL HYGIENE ITEMS': 'Personal Hygiene Items',
      'DETERGENTS': 'Detergents',
      'BREAD AND COOKIES': 'Bread and Cookies',
      'RICE': 'Rice',
      'OTHER FOODS': 'Other Foods',
      'COFFEE': 'Coffee',
      'OTHER ITEMS': 'Other Items',
      'MISCELLANEOUS': 'Other Items'
    };
    
    const upperText = text.toUpperCase();
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (upperText.includes(key)) {
        return value;
      }
    }
    
    // If no mapping found, return cleaned up version
    return text.trim();
  }

  removeDuplicates(items: InsertInventory[], existingItems: InsertInventory[]): InsertInventory[] {
    const existingNames = new Set(existingItems.map(item => item.itemName.toLowerCase().trim()));
    
    const uniqueItems = items.filter(item => {
      const itemNameLower = item.itemName.toLowerCase().trim();
      return !existingNames.has(itemNameLower);
    });
    
    console.log('🔄 Filtered out', items.length - uniqueItems.length, 'duplicate items');
    console.log('📝', uniqueItems.length, 'new items will be added');
    
    return uniqueItems;
  }

  /**
   * Ensure all categories from the inventory items exist in the database
   */
  async ensureCategoriesExist(items: InsertInventory[], storage: IStorage): Promise<void> {
    console.log('🏷️ Ensuring all categories exist in database...');
    
    // Get unique categories from the items
    const categorySet = new Set(items.map(item => item.category));
    const uniqueCategories = Array.from(categorySet);
    console.log('📋 Found categories in Excel:', uniqueCategories);
    
    // Get existing categories from database
    const existingCategories = await storage.getAllCategories();
    const existingCategoryNames = new Set(existingCategories.map(cat => cat.name));
    
    // Find categories that don't exist yet
    const newCategories = uniqueCategories.filter(categoryName => 
      !existingCategoryNames.has(categoryName)
    );
    
    if (newCategories.length > 0) {
      console.log('➕ Creating new categories:', newCategories);
      
      // Create each new category
      for (const categoryName of newCategories) {
        try {
          await storage.createCategory({
            name: categoryName,
            description: `Auto-created from Excel upload`
          });
          console.log('✅ Created category:', categoryName);
        } catch (error) {
          console.error('❌ Failed to create category:', categoryName, error);
        }
      }
    } else {
      console.log('✅ All categories already exist in database');
    }
  }
}

export const excelUploadService = new ExcelUploadService();

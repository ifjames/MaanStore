import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showNotification } from '@/lib/notifications';
import { motion } from 'framer-motion';
import { inventoryService, activityLogService } from '@/lib/firestore-service';
import { useAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

export function ExcelUploadComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!jsonData.length) throw new Error('Excel file is empty');

            console.log('Raw Excel data:', jsonData.slice(0, 10)); // Show first 10 rows
            
            // Try to find the header row by looking for common patterns
            let headerRowIndex = -1;
            let headerRow: string[] = [];
            
            // Look for a row that contains typical column names
            for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
              const row = jsonData[i] as any[];
              if (!row) continue;
              
              const rowStr = row.map(cell => cell?.toString().toLowerCase().trim()).join(' ');
              console.log(`Row ${i}:`, rowStr);
              
              // Check if this row contains column headers
              if (rowStr.includes('item') || rowStr.includes('product') || rowStr.includes('name')) {
                if (rowStr.includes('price') || rowStr.includes('stock') || rowStr.includes('quantity')) {
                  headerRowIndex = i;
                  headerRow = row.map((h: any) => h?.toString().trim().toLowerCase());
                  break;
                }
              }
            }
            
            // If no proper header found, assume the file has data without headers
            if (headerRowIndex === -1) {
              console.log('No header row found, assuming data starts from row 0');
              // Try to detect format by looking at first data row
              const firstDataRow = jsonData[0] as any[];
              if (firstDataRow && firstDataRow.length >= 2) {
                // Assume format: [itemName, price, stock, category] or similar
                showNotification.info(
                  'Excel format detected',
                  'No headers found. Assuming columns are: Item Name, Price, Stock, Category'
                );
                
                let itemCount = 0;
                const existingItems = await inventoryService.getAll();
                const existingItemNames = new Set(existingItems.map(item => item.itemName.toLowerCase()));
                
                for (let i = 0; i < jsonData.length; i++) {
                  const row = jsonData[i] as any[];
                  if (!row || row.length < 2) continue;
                  
                  const itemName = row[0]?.toString().trim();
                  const price = row[1];
                  const stock = row[2] || 0;
                  const category = row[3]?.toString().trim() || 'General';
                  
                  if (!itemName || itemName === '' || price === undefined) continue;
                  
                  if (existingItemNames.has(itemName.toLowerCase())) {
                    continue; // Skip duplicates
                  }
                  
                  const newItem = {
                    itemName,
                    price: price.toString(),
                    stock: parseInt(stock.toString()) || 0,
                    category,
                  };
                  
                  await inventoryService.create(newItem);
                  existingItemNames.add(itemName.toLowerCase());
                  itemCount++;
                }
                
                resolve({ itemCount, duplicatesSkipped: 0 });
                return;
              } else {
                throw new Error('Could not detect Excel file format. Please ensure your file has proper columns.');
              }
            }
            
            console.log('Found header row at index:', headerRowIndex);
            console.log('Header row:', headerRow);
            
            const colIndex = {
              itemName: headerRow.findIndex((h: string) => h.includes('item name') || h.includes('item') || h.includes('product')),
              category: headerRow.findIndex((h: string) => h.includes('category')),
              price: headerRow.findIndex((h: string) => h.includes('price')),
              stock: headerRow.findIndex((h: string) => h.includes('stock') || h.includes('quantity')),
            };
            
            console.log('Column indexes:', colIndex);
            
            // Check if we found the required columns
            if (colIndex.itemName === -1) {
              throw new Error('Could not find "Item Name" column in Excel file. Please ensure your Excel file has proper column headers.');
            }
            if (colIndex.price === -1) {
              throw new Error('Could not find "Price" column in Excel file. Please ensure your Excel file has proper column headers.');
            }
            if (colIndex.stock === -1) {
              throw new Error('Could not find "Stock" column in Excel file. Please ensure your Excel file has proper column headers.');
            }

            let itemCount = 0;
            let duplicatesSkipped = 0;
            const existingItems = await inventoryService.getAll();
            const existingItemNames = new Set(existingItems.map(item => item.itemName.toLowerCase()));
            
            console.log('Existing items count:', existingItems.length);
            console.log('Existing item names:', Array.from(existingItemNames));

            // Process data rows (skip header)
            let currentCategory = 'General';
            
            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              if (!row || row.length === 0) continue;
              
              // Check if this row is a category header (single column with category name)
              if (row.length === 1 && row[0] && typeof row[0] === 'string') {
                const potentialCategory = row[0].toString().trim();
                // Category headers are typically all caps or title case
                if (potentialCategory.length > 3 && !potentialCategory.includes('₱')) {
                  currentCategory = potentialCategory;
                  console.log(`Found category: ${currentCategory}`);
                  continue;
                }
              }
              
              const itemName = row[colIndex.itemName]?.toString().trim();
              const category = row[colIndex.category]?.toString().trim() || currentCategory;
              const price = row[colIndex.price];
              const stock = row[colIndex.stock];
              
              console.log(`Row ${i}:`, { itemName, category, price, stock });
              
              // Skip empty rows
              if (!itemName || itemName === '') {
                console.log(`Skipping row ${i}: empty item name`);
                continue;
              }
              
              if (price === undefined || price === null || price === '') {
                console.log(`Skipping row ${i}: empty price`);
                continue;
              }
              
              // Stock is optional - default to 0 if missing
              const stockValue = (stock === undefined || stock === null || stock === '') ? 0 : parseInt(stock.toString()) || 0;
              
              // Check for duplicates
              if (existingItemNames.has(itemName.toLowerCase())) {
                console.log(`Skipping row ${i}: duplicate item "${itemName}"`);
                duplicatesSkipped++;
                continue;
              }
              
              const newItem = {
                itemName,
                price: price.toString(),
                stock: stockValue,
                category,
              };
              
              console.log(`Creating item:`, newItem);
              await inventoryService.create(newItem);
              existingItemNames.add(itemName.toLowerCase());
              itemCount++;
            }
            
            // Log the bulk upload activity
            if (user && itemCount > 0) {
              try {
                await activityLogService.create({
                  userId: user.id,
                  action: 'INVENTORY_UPLOAD',
                  details: `Bulk uploaded ${itemCount} items from Excel file${duplicatesSkipped > 0 ? `, skipped ${duplicatesSkipped} duplicates` : ''}`
                });
              } catch (error) {
                console.warn('Failed to log upload activity:', error);
              }
            }
            
            resolve({ itemCount, duplicatesSkipped });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      
      if (data.itemCount > 0) {
        showNotification.success(
          'Upload successful', 
          `Added ${data.itemCount} items${data.duplicatesSkipped ? `, skipped ${data.duplicatesSkipped} duplicates` : ''}`
        );
      } else {
        showNotification.info(
          'No new items',
          'All items in the Excel file already exist in the inventory'
        );
      }
      
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      showNotification.error('Upload failed', error.message || 'Failed to upload Excel file');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isExcelFile(file)) {
        setSelectedFile(file);
      } else {
        showNotification.error('Invalid file', 'Please select an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isExcelFile(file)) {
        setSelectedFile(file);
      } else {
        showNotification.error('Invalid file', 'Please select an Excel file (.xlsx or .xls)');
      }
    }
  };

  const isExcelFile = (file: File) => {
    return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
           file.type === 'application/vnd.ms-excel' ||
           file.name.endsWith('.xlsx') ||
           file.name.endsWith('.xls');
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Upload Excel Inventory File</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Drag and drop your Excel file here, or{' '}
              <Label 
                htmlFor="excel-upload" 
                className="text-primary cursor-pointer hover:underline"
              >
                browse
              </Label>
            </p>
            <p className="text-xs text-gray-500">
              Supports .xlsx and .xls files (Max 10MB)
            </p>
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">{selectedFile.name}</span>
            <span className="text-xs text-green-600">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <Button
            onClick={() => setSelectedFile(null)}
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-800"
          >
            Remove
          </Button>
        </motion.div>
      )}

      <div className="flex space-x-2">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="flex-1"
        >
          {uploadMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Inventory
            </>
          )}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Excel File Requirements:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Categories will be auto-detected from section headers</li>
              <li>Stock will default to 100 for all items if it has none on the file</li>
              <li>Duplicate items will be automatically skipped</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { Badge } from "@/components/ui/badge";

interface LowStockAlertProps {
  item: {
    id: number;
    itemName: string;
    price: string;
    stock: number;
  };
}

export default function LowStockAlert({ item }: LowStockAlertProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{item.itemName}</h4>
          <p className="text-sm text-gray-600">${parseFloat(item.price).toFixed(2)}</p>
        </div>
        <div className="text-right">
          <Badge variant="destructive">
            {item.stock} left
          </Badge>
        </div>
      </div>
    </div>
  );
}

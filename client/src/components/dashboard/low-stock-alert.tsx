import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-red-200/50 p-4 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">{item.itemName}</h4>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(parseFloat(item.price))}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="destructive" className="shadow-sm">
            {item.stock} left
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

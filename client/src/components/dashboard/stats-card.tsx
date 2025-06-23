import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "primary" | "secondary" | "danger" | "accent";
}

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    primary: "bg-[#4CAF50] bg-opacity-20 text-[#4CAF50]",
    secondary: "bg-[#2196F3] bg-opacity-20 text-[#2196F3]",
    danger: "bg-[#F44336] bg-opacity-20 text-[#F44336]",
    accent: "bg-[#FF9800] bg-opacity-20 text-[#FF9800]",
  };

  const textColorClasses = {
    primary: "text-foreground",
    secondary: "text-foreground", 
    danger: "text-[#F44336]",
    accent: "text-foreground",
  };

  return (
    <Card className="store-card">
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
              <Icon size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="ml-3 sm:ml-4 w-0 flex-1 min-w-0">
            <dl>
              <dt className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</dt>
              <dd className={`text-base sm:text-lg lg:text-xl font-semibold ${textColorClasses[color]} truncate break-all`}>
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
    primary: "text-gray-900",
    secondary: "text-gray-900",
    danger: "text-[#F44336]",
    accent: "text-gray-900",
  };

  return (
    <Card className="store-card">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
              <Icon size={16} />
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className={`text-2xl font-semibold ${color === 'danger' ? textColorClasses[color] : 'text-gray-900'}`}>
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import Card from "@/components/ui/Card";
import type { StoreItemDisplay } from "@/types";

interface Props {
  item: StoreItemDisplay;
  onPurchase: (item: StoreItemDisplay) => void;
}

export default function StoreItemCard({ item, onPurchase }: Props) {
  const isOutOfStock = item.stock === 0;
  const coinLabel = item.coinType === "SC" ? "SC" : "MC";
  const coinColor = item.coinType === "SC" ? "text-green-700" : "text-amber-700";
  const coinBg = item.coinType === "SC" ? "bg-green-50" : "bg-amber-50";

  return (
    <Card padding="sm" className={isOutOfStock ? "opacity-50" : ""}>
      <div className="flex flex-col h-full">
        <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-3xl mb-2">
          {item.imageUrl || (item.category === "HEALTH_FOOD" ? "🥗" : "🎁")}
        </div>
        <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className={`text-sm font-bold ${coinColor} num`}>
            {item.price.toLocaleString()} {coinLabel}
          </span>
          <button
            onClick={() => onPurchase(item)}
            disabled={isOutOfStock}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : `${coinBg} ${coinColor} hover:opacity-80`
            }`}
          >
            {isOutOfStock ? "품절" : "구매"}
          </button>
        </div>
      </div>
    </Card>
  );
}

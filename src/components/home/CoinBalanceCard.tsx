"use client";

import Card from "@/components/ui/Card";

interface Props {
  scBalance: number;
  mcBalance: number;
}

export default function CoinBalanceCard({ scBalance, mcBalance }: Props) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-500 mb-3">내 코인</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-green-600 font-medium">StepCoin</p>
          <p className="text-xl font-bold text-green-700 num mt-1">
            {scBalance.toLocaleString()} <span className="text-sm">SC</span>
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-600 font-medium">MealCoin</p>
          <p className="text-xl font-bold text-amber-700 num mt-1">
            {mcBalance.toLocaleString()} <span className="text-sm">MC</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

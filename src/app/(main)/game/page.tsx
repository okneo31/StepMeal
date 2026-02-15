"use client";

import Link from "next/link";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";

const games = [
  {
    href: "/game/roulette",
    emoji: "🎰",
    title: "럭키 룰렛",
    description: "50 SC로 룰렛을 돌려 MC, 보호막 등 다양한 보상을 획득하세요!",
    badge: "하루 5회",
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    href: "/game/quiz",
    emoji: "🧠",
    title: "데일리 퀴즈",
    description: "건강 관련 퀴즈를 풀고 정답 시 20 MC를 획득하세요!",
    badge: "하루 3회",
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

export default function GamePage() {
  return (
    <div>
      <Header title="게임" />
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-gray-500">게임에 참여하고 보상을 받아보세요!</p>

        {games.map((game) => (
          <Link key={game.href} href={game.href}>
            <Card className={`border ${game.color} hover:shadow-md transition-shadow mb-4`}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">{game.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{game.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{game.description}</p>
                </div>
                <span className="text-gray-400 text-lg">→</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

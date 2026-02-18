import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProgress } from "@/lib/progress";

// GET: list courses + active attempt
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [courses, activeAttempt] = await Promise.all([
    prisma.courseQuest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseAttempt.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { course: true },
    }),
  ]);

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      checkpoints: JSON.parse(c.checkpoints),
      completionBonus: c.completionBonus,
      estimatedKm: c.estimatedKm,
    })),
    activeAttempt: activeAttempt
      ? {
          id: activeAttempt.id,
          courseId: activeAttempt.courseId,
          courseName: activeAttempt.course.name,
          currentCheckpoint: activeAttempt.currentCheckpoint,
          completedChecks: JSON.parse(activeAttempt.completedChecks),
          checkpoints: JSON.parse(activeAttempt.course.checkpoints),
          completionBonus: activeAttempt.course.completionBonus,
          totalEarned: activeAttempt.totalEarned,
          status: activeAttempt.status,
        }
      : null,
  });
}

// POST: start course attempt
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId } = await req.json();

    const existing = await prisma.courseAttempt.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    });
    if (existing) {
      return NextResponse.json({ error: "이미 진행 중인 코스가 있습니다." }, { status: 400 });
    }

    const course = await prisma.courseQuest.findUnique({ where: { id: courseId } });
    if (!course || !course.isActive) {
      return NextResponse.json({ error: "코스를 찾을 수 없습니다." }, { status: 400 });
    }

    const attempt = await prisma.courseAttempt.create({
      data: { userId: session.user.id, courseId },
    });

    return NextResponse.json({
      id: attempt.id,
      courseId: attempt.courseId,
      currentCheckpoint: 0,
      completedChecks: [],
      checkpoints: JSON.parse(course.checkpoints),
      completionBonus: course.completionBonus,
    });
  } catch (error) {
    console.error("Course start error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// PATCH: verify checkpoint arrival or cancel
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { attemptId, action, lat, lng } = await req.json();

    if (action === "cancel") {
      await prisma.courseAttempt.update({
        where: { id: attemptId },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ ok: true });
    }

    // Verify checkpoint
    const attempt = await prisma.courseAttempt.findFirst({
      where: { id: attemptId, userId: session.user.id, status: "ACTIVE" },
      include: { course: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "진행 중인 코스가 없습니다." }, { status: 400 });
    }

    const checkpoints = JSON.parse(attempt.course.checkpoints) as Array<{
      name: string; lat: number; lng: number; rewardSc: number; radiusM?: number;
    }>;
    const completedChecks: number[] = JSON.parse(attempt.completedChecks);
    const nextIdx = attempt.currentCheckpoint;

    if (nextIdx >= checkpoints.length) {
      return NextResponse.json({ error: "이미 모든 체크포인트를 완료했습니다." }, { status: 400 });
    }

    const cp = checkpoints[nextIdx];
    const radius = cp.radiusM || 50;

    // Haversine distance
    const R = 6371000;
    const dLat = ((cp.lat - lat) * Math.PI) / 180;
    const dLng = ((cp.lng - lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((cp.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (dist > radius) {
      return NextResponse.json({
        error: `체크포인트까지 ${Math.round(dist)}m 남았습니다. (${radius}m 이내 접근 필요)`,
        distance: Math.round(dist),
      }, { status: 400 });
    }

    // Checkpoint arrived!
    completedChecks.push(nextIdx);
    const newIdx = nextIdx + 1;
    const isComplete = newIdx >= checkpoints.length;

    const totalReward = cp.rewardSc + (isComplete ? attempt.course.completionBonus : 0);

    const result = await prisma.$transaction(async (tx) => {
      await tx.courseAttempt.update({
        where: { id: attempt.id },
        data: {
          currentCheckpoint: newIdx,
          completedChecks: JSON.stringify(completedChecks),
          totalEarned: { increment: totalReward },
          status: isComplete ? "COMPLETED" : "ACTIVE",
          completedAt: isComplete ? new Date() : undefined,
        },
      });

      const balance = await tx.coinBalance.update({
        where: { userId: session.user.id },
        data: { scBalance: { increment: totalReward }, scLifetime: { increment: totalReward } },
      });

      await tx.coinTransaction.create({
        data: {
          userId: session.user.id,
          coinType: "SC",
          amount: totalReward,
          balanceAfter: balance.scBalance,
          sourceType: "CHALLENGE",
          description: isComplete
            ? `코스 완주: ${attempt.course.name} (+${attempt.course.completionBonus} 완주 보너스)`
            : `코스 체크포인트: ${cp.name}`,
        },
      });

      return { scBalance: balance.scBalance };
    });

    if (isComplete) {
      await updateProgress(session.user.id, { type: "COURSE_COMPLETE" });
    }

    return NextResponse.json({
      checkpointReward: cp.rewardSc,
      completionBonus: isComplete ? attempt.course.completionBonus : 0,
      isComplete,
      currentCheckpoint: newIdx,
      completedChecks,
      totalEarned: attempt.totalEarned + totalReward,
      scBalance: result.scBalance,
    });
  } catch (error) {
    console.error("Course verify error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

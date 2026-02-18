import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY || "";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "검색어를 2글자 이상 입력해주세요." }, { status: 400 });
  }

  if (!KAKAO_REST_KEY) {
    return NextResponse.json({ error: "검색 서비스를 사용할 수 없습니다." }, { status: 503 });
  }

  try {
    const params = new URLSearchParams({ query, size: "10" });
    if (lat && lng) {
      params.set("y", lat);
      params.set("x", lng);
      params.set("sort", "distance");
    }

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "검색에 실패했습니다." }, { status: 502 });
    }

    const data = await res.json();
    const places = (data.documents || []).map((d: any) => ({
      id: d.id,
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      category: d.category_group_name,
      lat: parseFloat(d.y),
      lng: parseFloat(d.x),
      distance: d.distance ? parseInt(d.distance) : null,
      phone: d.phone,
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Quest search error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

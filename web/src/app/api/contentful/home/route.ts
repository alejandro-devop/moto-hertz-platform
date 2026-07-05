import { NextRequest, NextResponse } from "next/server";
import { contentfulService } from "@/services/contentful";
import type { HomePageData } from "@/types/contentful";

/**
 * API Route para obtener datos de la home page.
 * MOCK TEMPORAL — ver comentario en @/services/contentful.
 * GET /api/contentful/home
 */
export async function GET(_request: NextRequest) {
  try {
    const homeData: HomePageData = await contentfulService.getHomePageData();

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control":
        process.env.NODE_ENV === "production"
          ? "public, s-maxage=3600, stale-while-revalidate=86400"
          : "public, s-maxage=300, stale-while-revalidate=600",
    });

    return new NextResponse(JSON.stringify(homeData), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error en API route /api/contentful/home:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

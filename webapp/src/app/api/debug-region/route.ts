export const runtime = "nodejs";

export function GET() {
  return Response.json({
    vercel_region: process.env.VERCEL_REGION,
    vercel_url: process.env.VERCEL_URL,
  });
}

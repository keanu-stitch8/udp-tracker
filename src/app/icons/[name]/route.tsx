import { ImageResponse } from "next/og";

// Ikon PWA digambar saat diminta (tanpa file gambar). Path /icons/* dikecualikan dari proxy (bisa dibuka tanpa sesi).
const ICONS: Record<string, { size: number; maskable: boolean }> = {
  "180": { size: 180, maskable: false },
  "192": { size: 192, maskable: false },
  "512": { size: 512, maskable: false },
  "maskable-512": { size: 512, maskable: true },
};

export async function GET(_request: Request, ctx: RouteContext<"/icons/[name]">) {
  const icon = ICONS[(await ctx.params).name];
  if (!icon) return new Response("Not found", { status: 404 });
  const { size, maskable } = icon;
  // Maskable: launcher memotong tepi → isi di zona aman 80% tanpa bingkai.
  const box = maskable ? size * 0.6 : size * 0.78;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffdb33" }}>
        <div
          style={{
            width: box,
            height: box,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            border: `${Math.round(size * 0.04)}px solid #000`,
            boxShadow: `${Math.round(size * 0.04)}px ${Math.round(size * 0.04)}px 0 #000`,
            fontSize: box * 0.34,
            fontWeight: 800,
            color: "#000",
            letterSpacing: -box * 0.01,
          }}
        >
          UDP
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "cache-control": "public, max-age=86400" } },
  );
}

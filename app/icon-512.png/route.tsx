import { ImageResponse } from "next/og"

export const runtime = "edge"

const SIZE = { width: 512, height: 512 }

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#C8151B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20%",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "170px",
              height: "170px",
              background: "#F5B800",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "48px solid transparent",
                borderBottom: "48px solid transparent",
                borderLeft: "80px solid white",
                marginLeft: "16px",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            jolof
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  )
}

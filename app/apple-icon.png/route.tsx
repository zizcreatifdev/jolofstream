import { ImageResponse } from "next/og"

export const runtime = "edge"

const SIZE = { width: 180, height: 180 }

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
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
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
                borderTop: "16px solid transparent",
                borderBottom: "16px solid transparent",
                borderLeft: "28px solid white",
                marginLeft: "6px",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "26px",
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

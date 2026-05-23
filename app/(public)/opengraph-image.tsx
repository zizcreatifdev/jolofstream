import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Jolof Stream - Captation et diffusion en direct"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#161110",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "70%",
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(200,21,27,0.45), transparent 65%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "80px",
            fontSize: "32px",
            fontWeight: 700,
            color: "white",
            display: "flex",
          }}
        >
          Jolof <span style={{ color: "#C8151B", marginLeft: 8 }}>Stream</span>
        </div>

        <div
          style={{
            fontSize: "72px",
            fontWeight: 700,
            color: "white",
            lineHeight: 1.05,
            marginBottom: "24px",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Capturez l&apos;instant,</span>
          <span style={{ color: "#F5B800", fontStyle: "italic" }}>
            diffusez l&apos;emotion.
          </span>
        </div>

        <div
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "700px",
            display: "flex",
          }}
        >
          Captation HD et streaming live. Dakar, Senegal.
        </div>
      </div>
    ),
    { ...size }
  )
}

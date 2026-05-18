import { ImageResponse } from "next/og";

export const alt = "MTGO Events — Weekly calendar of Magic Online scheduled events";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #052e16 0%, #0a0a0a 55%, #18181b 100%)",
          color: "#fafafa",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "auto",
          }}
        >
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "18px",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  style={{ display: "flex", gap: "4px" }}
                >
                  {[0, 1, 2].map((col) => {
                    const i = row * 3 + col;
                    return (
                      <div
                        key={col}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          background: i === 4 ? "#fef3c7" : "#0a0a0a",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#a1a1aa",
            }}
          >
            mtgoevents.com
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "104px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            MTGO Events
          </div>
          <div
            style={{
              fontSize: "38px",
              color: "#d4d4d8",
              fontWeight: 400,
              lineHeight: 1.3,
            }}
          >
            Weekly calendar of every Magic Online scheduled event.
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {[
              "Modern",
              "Pauper",
              "Legacy",
              "Standard",
              "Pioneer",
              "Vintage",
              "Limited",
            ].map((f) => (
              <div
                key={f}
                style={{
                  fontSize: "24px",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid rgba(16, 185, 129, 0.4)",
                  color: "#a7f3d0",
                  fontWeight: 500,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

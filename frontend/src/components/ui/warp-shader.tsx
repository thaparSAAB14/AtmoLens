"use client";

import { Warp } from "@paper-design/shaders-react";

export function WarpShaderBackground() {
  return (
    <div className="absolute inset-0">
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={0.4}
        colors={[
          "hsl(200, 100%, 10%)",
          "hsl(190, 80%, 25%)",
          "hsl(180, 90%, 15%)",
          "hsl(210, 60%, 8%)",
        ]}
      />
    </div>
  );
}

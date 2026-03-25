import React from "react";
import { Composition } from "remotion";
import { VittorioComposition } from "./VittorioComposition";

export function RemotionRoot() {
  return (
    <Composition
      id="VittorioVideo"
      component={VittorioComposition}
      durationInFrames={1800}   // 60s @ 30fps — el server lo sobreescribe en runtime
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        videoUrl: "",
        classifiedWords: [],
        musicUrl: null,
        brollClips: [],
        durationInFrames: 1800,
      }}
    />
  );
}

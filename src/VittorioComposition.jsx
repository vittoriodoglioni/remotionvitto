import React from "react";
import {
  AbsoluteFill,
  Video,
  Audio,
  useVideoConfig,
  useCurrentFrame,
  interpolate,
  Sequence,
} from "remotion";
import { SubtitleLayer } from "./SubtitleLayer";

// ── Wordmark VITTORIO (bottom-left) ───────────────────────────────────────────
function WordmarkOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "3.5%",
        left: "3.5%",
        fontFamily: "'Bebas Neue', Impact, sans-serif",
        lineHeight: 1,
        background: "rgba(13,11,9,0.80)",
        borderLeft: "3px solid #8B9A3B",
        padding: "10px 18px 8px 14px",
        display: "inline-flex",
        flexDirection: "column",
      }}
    >
      <span
        style={{
          fontSize: 30,
          letterSpacing: "9px",
          color: "#E8E0D4",
          textTransform: "uppercase",
        }}
      >
        VITTORIO
      </span>
      <span
        style={{
          fontSize: 11,
          letterSpacing: "5px",
          color: "#8B9A3B",
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: 3,
        }}
      >
        MÉTODO ANCESTRAL
      </span>
    </div>
  );
}

// ── B-Roll clip ────────────────────────────────────────────────────────────────
function BRollClip({ clip, fps }) {
  const { durationInFrames } = useVideoConfig();
  const startFrame = Math.round(clip.start * fps);
  const lengthFrames = Math.min(
    Math.round(clip.duration * fps),
    durationInFrames - startFrame
  );
  if (lengthFrames <= 0) return null;

  return (
    <Sequence from={startFrame} durationInFrames={lengthFrames}>
      <AbsoluteFill>
        <Video
          src={clip.src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={0}
          startFrom={0}
        />
      </AbsoluteFill>
    </Sequence>
  );
}

// ── Composición principal ──────────────────────────────────────────────────────
export function VittorioComposition({
  videoUrl,
  classifiedWords = [],
  musicUrl = null,
  brollClips = [],
  durationInFrames,
}) {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#0D0B09" }}>
      {/* 1. Video principal */}
      <AbsoluteFill>
        <Video
          src={videoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={1}
        />
      </AbsoluteFill>

      {/* 2. B-rolls (si están habilitados) */}
      {brollClips.map((clip, i) => (
        <BRollClip key={i} clip={clip} fps={fps} />
      ))}

      {/* 3. Música de fondo */}
      {musicUrl && (
        <Audio
          src={musicUrl}
          volume={(frame) =>
            interpolate(
              frame,
              [0, fps * 1, durationInFrames - fps * 2, durationInFrames],
              [0, 0.12, 0.12, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          }
          loop
        />
      )}

      {/* 4. Subtítulos con clasificación de keywords */}
      <SubtitleLayer classifiedWords={classifiedWords} />

      {/* 5. Wordmark VITTORIO */}
      <WordmarkOverlay />
    </AbsoluteFill>
  );
}

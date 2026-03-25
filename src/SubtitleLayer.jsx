import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// ── Brand Kit VITTORIO ─────────────────────────────────────────────────────────
const BRAND = {
  normalColor: "#E8E0D4",
  keywordColor: "#8B9A3B",
  exclusiveColor: "#D4AA82",
  exclusiveBorderColor: "#D4AA82",
  backgroundColor: "rgba(13,11,9,0.75)",
  fontFamily: "'Bebas Neue', Impact, sans-serif",
  fontSize: 62,
  letterSpacing: "5px",
  textTransform: "uppercase",
  lineHeight: 1.2,
  borderRadius: 8,
  padding: "12px 28px",
};

// ── Componente Word — 3 tipologías ─────────────────────────────────────────────
function Word({ word, keyword }) {
  if (keyword === "exclusive") {
    return (
      <span
        style={{
          display: "inline-block",
          color: BRAND.exclusiveColor,
          border: `2px solid ${BRAND.exclusiveBorderColor}`,
          borderRadius: 5,
          padding: "2px 7px",
          marginRight: "0.25em",
          textShadow: `0 0 14px ${BRAND.exclusiveColor}55`,
        }}
      >
        {word}
      </span>
    );
  }
  if (keyword === "frequent") {
    return (
      <span
        style={{
          display: "inline-block",
          color: BRAND.keywordColor,
          marginRight: "0.25em",
          textShadow: `0 0 12px ${BRAND.keywordColor}44`,
        }}
      >
        {word}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-block",
        color: BRAND.normalColor,
        marginRight: "0.25em",
        textShadow: "0 3px 18px rgba(0,0,0,0.98), 0 1px 6px rgba(0,0,0,0.99)",
      }}
    >
      {word}
    </span>
  );
}

// ── SubtitleLayer ──────────────────────────────────────────────────────────────
// classifiedWords: [{ word, start, end, keyword? }]
// Cada bloque = 4 palabras. Se calcula en qué bloque estamos según el frame.
export function SubtitleLayer({ classifiedWords }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeSec = frame / fps;

  // Agrupar en bloques de 4 palabras
  const WORDS_PER_BLOCK = 4;
  const blocks = [];
  for (let i = 0; i < classifiedWords.length; i += WORDS_PER_BLOCK) {
    blocks.push(classifiedWords.slice(i, i + WORDS_PER_BLOCK));
  }

  // Encontrar bloque activo
  const activeBlock = blocks.find((block) => {
    const start = block[0].start;
    const end = block[block.length - 1].end;
    return currentTimeSec >= start - 0.05 && currentTimeSec <= end + 0.35;
  });

  if (!activeBlock) return null;

  const blockStart = activeBlock[0].start;
  const blockEnd = activeBlock[activeBlock.length - 1].end;
  const blockDuration = blockEnd - blockStart;

  // Fade in/out en frames
  const fadeInFrames = Math.round(fps * 0.12);
  const fadeOutFrames = Math.round(fps * 0.12);
  const blockStartFrame = Math.round(blockStart * fps);
  const blockEndFrame = Math.round(blockEnd * fps);

  const opacity = interpolate(
    frame,
    [
      blockStartFrame,
      blockStartFrame + fadeInFrames,
      blockEndFrame - fadeOutFrames,
      blockEndFrame + Math.round(fps * 0.35),
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.ease }
  );

  const translateY = interpolate(
    frame,
    [blockStartFrame, blockStartFrame + fadeInFrames],
    [10, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: "9%",
        left: "4%",
        right: "4%",
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: BRAND.backgroundColor,
          borderRadius: BRAND.borderRadius,
          padding: BRAND.padding,
          backdropFilter: "blur(6px)",
          fontFamily: BRAND.fontFamily,
          fontSize: BRAND.fontSize,
          fontWeight: 700,
          letterSpacing: BRAND.letterSpacing,
          textTransform: BRAND.textTransform,
          lineHeight: BRAND.lineHeight,
          textAlign: "center",
          maxWidth: 1000,
        }}
      >
        {activeBlock.map((w, i) => (
          <Word key={i} word={w.word} keyword={w.keyword} />
        ))}
      </div>
    </div>
  );
}

export type CaptionStyle = {
  name: string;

  fontFamily: string;
  fontSize: number;
  fontWeight: number;

  color: string;
  activeColor: string;

  strokeColor: string;
  strokeWidth: number;

  position: "top" | "center" | "bottom";

  maxWordsPerLine: number;

  uppercase: boolean;

  animation:
    | "none"
    | "pop"
    | "bounce"
    | "highlight";
};

export const CAPTION_STYLES: Record<string, CaptionStyle> = {
  captions: {
    name: "Captions",

    fontFamily: "Arial",
    fontSize: 72,
    fontWeight: 900,

    color: "#FFFFFF",
    activeColor: "#FFFF00",

    strokeColor: "#000000",
    strokeWidth: 6,

    position: "bottom",

    maxWordsPerLine: 4,

    uppercase: true,

    animation: "pop",
  },

  clean: {
    name: "Clean",

    fontFamily: "Arial",
    fontSize: 64,
    fontWeight: 700,

    color: "#FFFFFF",
    activeColor: "#FFFFFF",

    strokeColor: "#000000",
    strokeWidth: 3,

    position: "bottom",

    maxWordsPerLine: 5,

    uppercase: false,

    animation: "none",
  },

  gaming: {
    name: "Gaming",

    fontFamily: "Arial",
    fontSize: 76,
    fontWeight: 900,

    color: "#FFFFFF",
    activeColor: "#00FF66",

    strokeColor: "#000000",
    strokeWidth: 7,

    position: "center",

    maxWordsPerLine: 4,

    uppercase: true,

    animation: "bounce",
  },
};

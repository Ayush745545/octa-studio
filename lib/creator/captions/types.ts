export type CaptionWord = {
  word: string;
  start: number;
  end: number;
};

export type CaptionSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words: CaptionWord[];
};

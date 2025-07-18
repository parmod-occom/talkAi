export type Viseme = {
  viseme: string;
  time: number;
};

export type TalkToAIResponse = {
  answer: string;
  visemes: Viseme[];
};

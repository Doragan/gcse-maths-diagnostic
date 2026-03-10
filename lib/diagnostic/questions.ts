export interface Question {
  id: number;
  skill: string;
  text: string;
  answer: string;
}

export const questions: Question[] = [
  { id: 1, skill: "expanding", text: "Expand 2(x + 3)", answer: "2x+6" },
  { id: 2, skill: "factorising", text: "Factorise x² + 5x + 6", answer: "(x+2)(x+3)" }
];
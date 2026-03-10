import { skills } from "./skills";

export interface Course {
  id: string
  name: string
  skills: string[]
}

export const courses: Course[] = [
  {
    id: "gcse_foundation",
    name: "GCSE Foundation",
    skills: skills.map(s => s.id)
  },
  {
    id: "gcse_higher",
    name: "GCSE Higher",
    skills: skills.map(s => s.id)
  }
];
import type { Character } from "../../../../api/backendApi";

export type ExtendedSkills = {
  implementation: number;
  planning: number;
  speed: number;
  review: number;
  stamina: number;
  adaptability: number;
};

export type Trait = {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorVars: { bg: string; border: string; text: string };
};

export type ExtendedCharacter = Omit<Character, "skills"> & {
  skills: Character["skills"] &
    Partial<Omit<ExtendedSkills, keyof Character["skills"]>>;
  traits?: Trait[];
};

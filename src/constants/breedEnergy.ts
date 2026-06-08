export interface BreedEnergy {
  breed: string;
  energy_level: number;
  energy_category: string;
}

export const BREED_ENERGY_DATA: BreedEnergy[] = [
  { "breed": "Maltese", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Poodle", "energy_level": 0.8, "energy_category": "Energetic" },
  { "breed": "Pomeranian", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Golden Retriever", "energy_level": 0.8, "energy_category": "Energetic" },
  { "breed": "Bichon Frise", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Shiba Inu", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Welsh Corgi", "energy_level": 0.8, "energy_category": "Energetic" },
  { "breed": "Chihuahua", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Yorkshire Terrier", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Shih Tzu", "energy_level": 0.4, "energy_category": "Calm" },
  { "breed": "Dachshund", "energy_level": 0.6, "energy_category": "Regular Exercise" },
  { "breed": "Jindo", "energy_level": 0.8, "energy_category": "Energetic" },
  { "breed": "Mixed Breed", "energy_level": 0.6, "energy_category": "Regular Exercise" }
];

export function getEnergyByBreed(breedName: string): BreedEnergy | undefined {
  // Extract English name from "Korean (English)" format
  const match = breedName.match(/\((.*?)\)/);
  const englishName = match ? match[1] : breedName;
  return BREED_ENERGY_DATA.find(b => b.breed.toLowerCase() === englishName.toLowerCase());
}

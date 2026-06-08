import { useCallback, useState } from 'react';
import { decodeTendency } from '../utils/dogTendency';
import { getEnergyByBreed } from '../constants/breedEnergy';

export type DogGender = 'M' | 'F' | 'MN' | 'FN';

export interface DogFormState {
  name: string;
  weight: string;
  birthDate: string;
  gender: DogGender;
  tendency: string;
  selectedBreed: string;
  breedSearch: string;
  showBreedSearch: boolean;
  avatarUri: string | null;
  energyLevel: number;
  energyCategory: string;
}

export const EMPTY_DOG_FORM: DogFormState = {
  name: '',
  weight: '',
  birthDate: '',
  gender: 'M',
  tendency: '',
  selectedBreed: '',
  breedSearch: '',
  showBreedSearch: false,
  avatarUri: null,
  energyLevel: 0.6,
  energyCategory: 'Regular Exercise',
};

export function useDogForm(initial: DogFormState = EMPTY_DOG_FORM) {
  const [form, setForm] = useState<DogFormState>(initial);

  const patch = useCallback((p: Partial<DogFormState>) => {
    setForm((prev) => {
      const newState = { ...prev, ...p };
      // Auto-update energy level when breed changes
      if (p.selectedBreed && p.selectedBreed !== prev.selectedBreed) {
        const energyData = getEnergyByBreed(p.selectedBreed);
        if (energyData) {
          newState.energyLevel = energyData.energy_level;
          newState.energyCategory = energyData.energy_category;
        }
      }
      return newState;
    });
  }, []);

  const reset = useCallback(() => setForm(EMPTY_DOG_FORM), []);

  const hydrateFromDog = useCallback((dog: {
    name: string; weight: number | string; birth_date?: string;
    gender?: DogGender; tendency?: string; breed?: string;
  }) => {
    const { avatarUri, cleanTendency } = decodeTendency(dog.tendency);
    const energyData = dog.breed ? getEnergyByBreed(dog.breed) : null;
    
    setForm({
      name: dog.name,
      weight: String(dog.weight),
      birthDate: dog.birth_date || '',
      gender: dog.gender || 'M',
      tendency: cleanTendency,
      selectedBreed: dog.breed || '',
      breedSearch: '',
      showBreedSearch: false,
      avatarUri,
      energyLevel: energyData?.energy_level || 0.6,
      energyCategory: energyData?.energy_category || 'Regular Exercise',
    });
  }, []);

  return { form, setForm, patch, reset, hydrateFromDog };
}

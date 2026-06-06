// 반려견 등록/수정 폼 상태 통합 훅 — 두 벌(dogName/editDogName ...) 중복 제거.
import { useCallback, useState } from 'react';
import { decodeTendency } from '../utils/dogTendency';

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
};

export function useDogForm(initial: DogFormState = EMPTY_DOG_FORM) {
  const [form, setForm] = useState<DogFormState>(initial);

  const patch = useCallback((p: Partial<DogFormState>) => {
    setForm((prev) => ({ ...prev, ...p }));
  }, []);

  const reset = useCallback(() => setForm(EMPTY_DOG_FORM), []);

  const hydrateFromDog = useCallback((dog: {
    name: string; weight: number | string; birth_date?: string;
    gender?: DogGender; tendency?: string; breed?: string;
  }) => {
    const { avatarUri, cleanTendency } = decodeTendency(dog.tendency);
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
    });
  }, []);

  return { form, setForm, patch, reset, hydrateFromDog };
}

// Supabase 반려견 CRUD 훅 — 원본 ProfileScreen 동작과 1:1 동일
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../supabase';
import { encodeTendency } from '../utils/dogTendency';

export interface DogRecord {
  id: string;
  name: string;
  breed: string;
  weight: number;
  birth_date: string;
  gender: 'M' | 'F' | 'MN' | 'FN';
  tendency: string;
  user_id: string;
  created_at?: string;
}

export interface DogInput {
  name: string;
  weight: string;
  birthDate: string;
  gender: 'M' | 'F' | 'MN' | 'FN';
  breed: string;
  tendency: string;
  avatarUri: string | null;
}

function validate(input: DogInput): string | null {
  if (!input.name || !input.weight || !input.birthDate || !input.breed || !input.tendency) {
    return '모든 필수 항목을 입력하고 견종을 검색하여 선택해 주세요.';
  }
  if (isNaN(parseFloat(input.weight))) return '체중은 숫자 형식이어야 합니다.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) return '생년월일은 YYYY-MM-DD 형식을 지켜야 합니다.';
  return null;
}

export function useDogs() {
  const [dogs, setDogs] = useState<DogRecord[]>([]);
  const [fetching, setFetching] = useState<boolean>(true);

  const fetchDogs = useCallback(async () => {
    setFetching(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setDogs(data as DogRecord[]);
    }
    setFetching(false);
  }, []);

  useEffect(() => { fetchDogs(); }, [fetchDogs]);

  const insertDog = useCallback(async (input: DogInput): Promise<boolean> => {
    const err = validate(input);
    if (err) { Alert.alert('오류', err); return false; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from('dogs').insert([{
      user_id: user.id,
      name: input.name,
      breed: input.breed,
      weight: parseFloat(input.weight),
      birth_date: input.birthDate,
      gender: input.gender,
      tendency: encodeTendency(input.avatarUri, input.tendency),
    }]);
    if (error) { Alert.alert('등록 실패', error.message); return false; }
    Alert.alert('등록 성공', '반려견의 프로필 정보가 안전하게 동기화되었습니다.');
    await fetchDogs();
    return true;
  }, [fetchDogs]);

  const updateDog = useCallback(async (id: string, input: DogInput): Promise<boolean> => {
    if (!input.name || !input.weight || !input.birthDate || !input.breed || !input.tendency) {
      Alert.alert('오류', '모든 필수 항목을 입력해주세요.');
      return false;
    }
    if (isNaN(parseFloat(input.weight))) { Alert.alert('오류', '체중은 숫자 형식이어야 합니다.'); return false; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) { Alert.alert('오류', '생년월일은 YYYY-MM-DD 형식을 지켜야 합니다.'); return false; }
    const { error } = await supabase.from('dogs').update({
      name: input.name,
      breed: input.breed,
      weight: parseFloat(input.weight),
      birth_date: input.birthDate,
      gender: input.gender,
      tendency: encodeTendency(input.avatarUri, input.tendency),
    }).eq('id', id);
    if (error) { Alert.alert('수정 실패', error.message); return false; }
    Alert.alert('수정 완료', '반려견 프로필이 수정되었습니다.');
    await fetchDogs();
    return true;
  }, [fetchDogs]);

  return { dogs, fetching, fetchDogs, insertDog, updateDog };
}

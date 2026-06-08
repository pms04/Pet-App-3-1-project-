import { Alert } from 'react-native';
import { supabase } from '../../supabase';

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('로그인이 필요합니다.');
  return user;
}

export function showError(title: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '알 수 없는 오류가 발생했습니다.');
  Alert.alert(title, message);
}

export function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

export function formatTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimeLabel(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(value)}`;
}

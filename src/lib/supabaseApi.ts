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

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    // [object Object] 문자열이 들어오는 경우 방지
    const messageStr = String(value.message || '');
    if (messageStr.includes('[object Object]')) return '데이터를 불러올 수 없습니다.';

    const parts = [value.message, value.details, value.hint, value.code]
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    if (parts.length) return parts.join('\n');
  }
  return '잠시 후 다시 시도해 주세요.';
}

function isQuietLoadError(title: string, message: string) {
  const lower = message.toLowerCase();
  return title.includes('불러오기 실패') && (
    lower.includes('no rows') ||
    lower.includes('0 rows') ||
    lower.includes('not found') ||
    lower.includes('pgrst116') ||
    lower.includes('empty') ||
    message === '잠시 후 다시 시도해 주세요.'
  );
}

export function showError(title: string, error: unknown) {
  const message = normalizeErrorMessage(error);
  if (isQuietLoadError(title, message)) {
    console.warn(`[${title}]`, message);
    return;
  }
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

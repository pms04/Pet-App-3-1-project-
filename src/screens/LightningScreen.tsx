import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert,
} from 'react-native';
import { CALENDAR_EVENTS, WALK_DATES } from '../constants/mockData';

// ── 날짜 유틸 ─────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=일
}
function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ── 번개 만들기 모달 ─────────────────────────────────────
function CreateLightningModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [maxP, setMaxP] = useState('4');

  const handleSave = () => {
    if (!title || !location || !time) {
      Alert.alert('입력 확인', '제목, 장소, 시간을 모두 입력해주세요.');
      return;
    }
    Alert.alert('번개 생성 완료', `"${title}" 번개가 등록되었습니다!\n(실제 저장은 Supabase 연동 후 적용)`);
    setTitle(''); setLocation(''); setTime(''); setMaxP('4');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>취소</Text></TouchableOpacity>
          <Text style={s.modalTitle}>⚡ 번개 만들기</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.modalSave}>등록</Text></TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <Text style={s.inputLabel}>번개 제목</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="예: 한강 저녁 산책 번개" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>장소</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="예: 여의도 한강공원 3주차장" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>시간</Text>
          <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="예: 18:30" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>최대 참여 인원</Text>
          <TextInput style={s.input} value={maxP} onChangeText={setMaxP} keyboardType="numeric" placeholder="4" placeholderTextColor="#C7C7CC" />

          <View style={{ backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: '#636366', lineHeight: 20 }}>
              🤖 <Text style={{ fontWeight: '700' }}>AI 브리핑</Text>은 번개 등록 후 자동으로 생성됩니다.{'\n'}
              참여자 강아지들의 궁합 분석 결과를 요약해드려요.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────
export function LightningScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  // 선택된 날짜의 번개 이벤트
  const selectedEvents = selectedDate
    ? CALENDAR_EVENTS.filter(e => e.date === selectedDate)
    : [];

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  // 캘린더 셀 배열 (빈칸 + 날짜)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 헤더 */}
        <View style={s.header}>
          <Text style={s.headerTitle}>⚡ 번개</Text>
        </View>

        {/* 월 이동 */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthLabel}>{year}년 {MONTH_NAMES[month]}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
            <Text style={s.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 캘린더 표 */}
        <View style={s.calendarCard}>
          {/* 요일 헤더 */}
          <View style={s.weekRow}>
            {WEEK_LABELS.map((d, i) => (
              <Text key={d} style={[s.weekLabel, i === 0 && { color: '#FF3B30' }, i === 6 && { color: '#007AFF' }]}>{d}</Text>
            ))}
          </View>

          {/* 날짜 격자 */}
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={s.cell} />;
              const key = toKey(year, month, day);
              const mark = WALK_DATES[key];
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const dayOfWeek = (firstDay + day - 1) % 7;

              return (
                <TouchableOpacity
                  key={key}
                  style={[s.cell, isSelected && s.cellSelected, isToday && !isSelected && s.cellToday]}
                  onPress={() => setSelectedDate(isSelected ? null : key)}
                >
                  <Text style={[
                    s.dayText,
                    isSelected && { color: '#fff' },
                    isToday && !isSelected && { color: '#FF8C00', fontWeight: '700' },
                    dayOfWeek === 0 && !isSelected && { color: '#FF3B30' },
                    dayOfWeek === 6 && !isSelected && { color: '#007AFF' },
                  ]}>
                    {day}
                  </Text>
                  {/* 점 마커 */}
                  {mark && (
                    <View style={s.dotRow}>
                      {(mark.type === 'walk' || mark.type === 'both') && (
                        <View style={[s.dot, { backgroundColor: '#FF8C00' }]} />
                      )}
                      {(mark.type === 'lightning' || mark.type === 'both') && (
                        <View style={[s.dot, { backgroundColor: '#007AFF' }]} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 범례 */}
          <View style={s.legend}>
            <View style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: '#FF8C00', width: 8, height: 8 }]} />
              <Text style={s.legendText}>산책 기록</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: '#007AFF', width: 8, height: 8 }]} />
              <Text style={s.legendText}>번개 예약</Text>
            </View>
          </View>
        </View>

        {/* 선택 날짜 이벤트 */}
        {selectedDate && selectedEvents.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
            <Text style={s.sectionTitle}>📌 {selectedDate.replace(/-/g, '.')} 번개</Text>
            {selectedEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {/* 예정된 번개 전체 목록 */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={s.sectionTitle}>📋 예정된 번개</Text>
          {CALENDAR_EVENTS.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      </ScrollView>

      {/* 번개 만들기 FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowCreateModal(true)}>
        <Text style={s.fabText}>+ 번개 만들기</Text>
      </TouchableOpacity>

      <CreateLightningModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </View>
  );
}

function EventCard({ event }: { event: (typeof CALENDAR_EVENTS)[0] }) {
  const [joined, setJoined] = useState(false);
  return (
    <View style={s.eventCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: '#FF8C00', fontWeight: '700', marginBottom: 3 }}>
            {event.displayDate} {event.time}
          </Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 5 }}>{event.title}</Text>
          <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 10 }}>📍 {event.location}</Text>
        </View>
        <View style={s.participantBadge}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF8C00' }}>
            {event.participants}/{event.maxParticipants}명
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12, marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: '#48484A', lineHeight: 18 }}>
          <Text style={{ fontWeight: '700' }}>🤖 AI 브리핑: </Text>
          {event.aiSummary}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1C1C1E' }}>{event.weather}</Text>
        <TouchableOpacity
          style={[s.joinBtn, joined && { backgroundColor: '#E5E5EA' }]}
          onPress={() => setJoined(j => !j)}
        >
          <Text style={[s.joinBtnText, joined && { color: '#8E8E93' }]}>
            {joined ? '참여 취소' : '참여하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 24 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', minWidth: 120, textAlign: 'center' },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  navBtnText: { fontSize: 22, color: '#1C1C1E', lineHeight: 28 },
  calendarCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellSelected: { backgroundColor: '#FF8C00', borderRadius: 100 },
  cellToday: { backgroundColor: '#FFF3E0', borderRadius: 100 },
  dayText: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#E5E5EA' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontSize: 11, color: '#8E8E93' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  eventCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  participantBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  joinBtn: { backgroundColor: '#FF8C00', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#FF8C00', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#FF8C00', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  modalCancel: { fontSize: 15, color: '#8E8E93' },
  modalSave: { fontSize: 15, color: '#FF8C00', fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E', borderWidth: 0.5, borderColor: '#E5E5EA' },
});

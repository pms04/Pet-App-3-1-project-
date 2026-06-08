import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LightningWalk, useLightningWalks } from '../hooks/useLightningWalks';
import { useWalkLogs } from '../hooks/useWalkLogs';

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toKey(year: number, month: number, day: number) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function CreateLightningModal({
  visible,
  selectedDate,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSubmit: (input: { title: string; location: string; date: string; time: string; maxParticipants: string }) => Promise<boolean>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(selectedDate || today);
  const [time, setTime] = useState('18:30');
  const [maxParticipants, setMaxParticipants] = useState('4');
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setLocation(''); setDate(selectedDate || today); setTime('18:30'); setMaxParticipants('4'); };
  const handleSave = async () => {
    setSaving(true);
    const ok = await onSubmit({ title, location, date, time, maxParticipants });
    setSaving(false);
    if (ok) { reset(); onClose(); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>취소</Text></TouchableOpacity>
          <Text style={s.modalTitle}>번개 만들기</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}><Text style={s.modalSave}>{saving ? '등록 중' : '등록'}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.inputLabel}>번개 제목</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="예: 한강 저녁 산책 번개" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>장소</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="예: 여의도 한강공원" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>날짜</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>시간</Text>
          <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor="#C7C7CC" />
          <Text style={s.inputLabel}>최대 참여 인원</Text>
          <TextInput style={s.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" placeholder="4" placeholderTextColor="#C7C7CC" />
        </ScrollView>
      </View>
    </Modal>
  );
}

export function LightningScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const lightning = useLightningWalks();
  const walkLogs = useWalkLogs();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedEvents = selectedDate ? lightning.walks.filter((walk) => walk.starts_at.slice(0, 10) === selectedDate) : [];
  const marks = { ...walkLogs.markedDates, ...lightning.markedDates };
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const refresh = async () => { await lightning.refresh(); await walkLogs.refresh(); };

  const prevMonth = () => { month === 0 ? (setYear((y) => y - 1), setMonth(11)) : setMonth((m) => m - 1); setSelectedDate(null); };
  const nextMonth = () => { month === 11 ? (setYear((y) => y + 1), setMonth(0)) : setMonth((m) => m + 1); setSelectedDate(null); };

  return (
    <View style={s.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.header}><Text style={s.headerTitle}>번개</Text></View>
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}><Text style={s.navBtnText}>‹</Text></TouchableOpacity>
          <Text style={s.monthLabel}>{year}년 {MONTH_NAMES[month]}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn}><Text style={s.navBtnText}>›</Text></TouchableOpacity>
        </View>
        <View style={s.calendarCard}>
          <View style={s.weekRow}>{WEEK_LABELS.map((d, i) => <Text key={d} style={[s.weekLabel, i === 0 && { color: '#FF3B30' }, i === 6 && { color: '#007AFF' }]}>{d}</Text>)}</View>
          <View style={s.grid}>{cells.map((day, idx) => {
            if (!day) return <View key={`empty-${idx}`} style={s.cell} />;
            const key = toKey(year, month, day);
            const mark = marks[key];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const dayOfWeek = (firstDay + day - 1) % 7;
            return (
              <TouchableOpacity key={key} style={[s.cell, isSelected && s.cellSelected, isToday && !isSelected && s.cellToday]} onPress={() => setSelectedDate(isSelected ? null : key)}>
                <Text style={[s.dayText, isSelected && { color: '#fff' }, isToday && !isSelected && { color: '#FF8C00', fontWeight: '700' }, dayOfWeek === 0 && !isSelected && { color: '#FF3B30' }, dayOfWeek === 6 && !isSelected && { color: '#007AFF' }]}>{day}</Text>
                {mark && <View style={[s.dot, { backgroundColor: mark === 'walk' ? '#FF8C00' : '#007AFF' }]} />}
              </TouchableOpacity>
            );
          })}</View>
          <View style={s.legend}><Text style={s.legendText}>주황: 산책 기록 · 파랑: 번개 예약</Text></View>
        </View>

        {selectedDate && (
          <View style={s.section}><Text style={s.sectionTitle}>{selectedDate.replace(/-/g, '.')} 번개</Text>{selectedEvents.length ? selectedEvents.map((event) => <EventCard key={event.id} event={event} onToggle={lightning.toggleJoin} />) : <EmptyText text="선택한 날짜에 등록된 번개가 없습니다." />}</View>
        )}
        <View style={s.section}><Text style={s.sectionTitle}>예정된 번개</Text>{lightning.loading ? <ActivityIndicator color="#FF8C00" /> : lightning.walks.length ? lightning.walks.map((event) => <EventCard key={event.id} event={event} onToggle={lightning.toggleJoin} />) : <EmptyText text="아직 등록된 번개가 없습니다." />}</View>
      </ScrollView>
      <TouchableOpacity style={s.fab} onPress={() => setShowCreateModal(true)}><Text style={s.fabText}>+ 번개 만들기</Text></TouchableOpacity>
      <CreateLightningModal visible={showCreateModal} selectedDate={selectedDate} onClose={() => setShowCreateModal(false)} onSubmit={lightning.createWalk} />
    </View>
  );
}

function EmptyText({ text }: { text: string }) { return <View style={s.emptyCard}><Text style={s.emptyText}>{text}</Text></View>; }

function EventCard({ event, onToggle }: { event: LightningWalk; onToggle: (event: LightningWalk) => void }) {
  return (
    <View style={s.eventCard}>
      <View style={s.eventTop}><View style={{ flex: 1 }}><Text style={s.eventDate}>{new Date(event.starts_at).toLocaleString()}</Text><Text style={s.eventTitle}>{event.title}</Text><Text style={s.eventLocation}>장소 {event.location}</Text></View><View style={s.participantBadge}><Text style={s.participantText}>{event.participant_count}/{event.max_participants}명</Text></View></View>
      <View style={s.summaryBox}><Text style={s.summaryText}>{event.ai_summary || '참여자 정보가 쌓이면 산책 브리핑을 확인할 수 있습니다.'}</Text></View>
      <View style={s.eventBottom}><Text style={s.weatherText}>{event.weather || '날씨 확인 필요'}</Text><TouchableOpacity style={[s.joinBtn, event.joined && { backgroundColor: '#E5E5EA' }]} onPress={() => onToggle(event)}><Text style={[s.joinBtnText, event.joined && { color: '#8E8E93' }]}>{event.joined ? '참여 취소' : '참여하기'}</Text></TouchableOpacity></View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginVertical: 10 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 28, color: '#FF8C00' },
  monthLabel: { fontSize: 19, fontWeight: '800', color: '#1C1C1E' },
  calendarCard: { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cellSelected: { backgroundColor: '#FF8C00' },
  cellToday: { backgroundColor: '#FFF3E0' },
  dayText: { fontSize: 15, color: '#1C1C1E' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  legend: { alignItems: 'center', marginTop: 12 },
  legendText: { fontSize: 12, color: '#8E8E93' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 10 },
  eventCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventDate: { fontSize: 13, color: '#FF8C00', fontWeight: '700', marginBottom: 3 },
  eventTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 5 },
  eventLocation: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  participantBadge: { backgroundColor: '#FFF3E0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  participantText: { fontSize: 12, fontWeight: '700', color: '#FF8C00' },
  summaryBox: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12, marginBottom: 10 },
  summaryText: { fontSize: 12, color: '#48484A', lineHeight: 18 },
  eventBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  joinBtn: { backgroundColor: '#FF8C00', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 14 },
  joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  emptyText: { color: '#8E8E93', fontSize: 13 },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#FF8C00', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30, shadowColor: '#FF8C00', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  modalCancel: { fontSize: 15, color: '#8E8E93' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  modalSave: { fontSize: 15, color: '#FF8C00', fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E' },
});

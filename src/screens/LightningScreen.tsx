import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Modal, TextInput, ActivityIndicator,
  RefreshControl, Alert, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { LightningWalk, useLightningWalks } from '../hooks/useLightningWalks';
import { useWalkLogs } from '../hooks/useWalkLogs';
import { T } from '../styles/styles';

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ── 번개 만들기 모달 (네이버 지도 API 연동)
function CreateLightningModal({
  visible, selectedDate, onClose, onSubmit, userLocation,
}: {
  visible: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSubmit: (input: any) => Promise<boolean>;
  userLocation: string | null;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(selectedDate || today);
  const [time, setTime] = useState('18:30');
  const [maxParticipants, setMaxParticipants] = useState('4');
  const [region, setRegion] = useState(userLocation || '');
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pinCoord, setPinCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('');

  const reset = () => {
    setTitle(''); setLocation(''); setDate(selectedDate || today);
    setTime('18:30'); setMaxParticipants('4'); setPinCoord(null);
    setRegion(userLocation || ''); setLocationName('');
  };

  const handleSave = async () => {
    if (!title.trim() || !location.trim() || !date || !time) {
      Alert.alert('입력 확인', '제목, 장소, 날짜, 시간을 모두 입력해 주세요.');
      return;
    }
    setSaving(true);
    const ok = await onSubmit({
      title: title.trim(),
      location: location.trim(),
      date,
      time,
      maxParticipants,
      locationLat: pinCoord?.latitude ?? null,
      locationLng: pinCoord?.longitude ?? null,
      region: region.trim() || userLocation || null,
    });
    setSaving(false);
    if (ok) { reset(); onClose(); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>취소</Text></TouchableOpacity>
          <Text style={s.modalTitle}>번개 만들기</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={s.modalSave}>{saving ? '등록 중' : '등록'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.inputLabel}>번개 제목</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="예: 한강 저녁 산책 번개" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>장소 이름</Text>
          <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="예: 여의도 한강공원" placeholderTextColor="#C7C7CC" />

          {/* 지도 핀 찍기 */}
          <TouchableOpacity
            style={[s.mapPickerBtn, pinCoord && { borderColor: T.accent }]}
            onPress={() => setShowMapPicker(true)}
          >
            <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
            <Text style={{ color: pinCoord ? T.accent : T.label4, fontWeight: '600', fontSize: 14 }}>
              {locationName || (pinCoord ? `위치 설정됨` : '지도에서 정확한 위치 핀 찍기')}
            </Text>
          </TouchableOpacity>

          <Text style={s.inputLabel}>날짜</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>시간</Text>
          <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>최대 참여 인원</Text>
          <TextInput style={s.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" placeholder="4" placeholderTextColor="#C7C7CC" />

          <Text style={s.inputLabel}>지역 태그</Text>
          <TextInput style={s.input} value={region} onChangeText={setRegion} placeholder="예: 서울 마포구" placeholderTextColor="#C7C7CC" />

          <View style={s.infoBox}>
            <Text style={s.infoText}>지정된 시간이 지나면 번개가 자동으로 사라집니다.</Text>
          </View>
        </ScrollView>
      </View>

      {/* 지도 핀 찍기 모달 */}
      <Modal visible={showMapPicker} animationType="slide" onRequestClose={() => setShowMapPicker(false)}>
        <View style={{ flex: 1 }}>
          <View style={s.mapPickerHeader}>
            <TouchableOpacity onPress={() => setShowMapPicker(false)}>
              <Text style={s.modalCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>위치 선택</Text>
            <TouchableOpacity onPress={() => setShowMapPicker(false)}>
              <Text style={s.modalSave}>확인</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.mapPickerHint}>지도를 길게 눌러 정확한 위치를 설정해 주세요.</Text>
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_DEFAULT}
            initialRegion={{ latitude: 37.5665, longitude: 126.9780, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            onLongPress={(e) => {
              const coord = e.nativeEvent.coordinate;
              setPinCoord(coord);
              // 네이버 지도 API로 역지오코딩 (선택사항 — 실제 연동 시)
              setLocationName(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
            }}
          >
            {pinCoord && <Marker coordinate={pinCoord} />}
          </MapView>
        </View>
      </Modal>
    </Modal>
  );
}

// ── 지역 필터 선택 모달 (거주지 + 선택 지역)
function RegionFilterModal({
  visible, current, userLocation, onSelect, onClose,
}: {
  visible: boolean;
  current: string | null;
  userLocation: string | null;
  onSelect: (region: string | null) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState('');
  const presets = ['서울 강남구', '서울 마포구', '서울 송파구', '경기 성남시', '부산 해운대구'];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>닫기</Text></TouchableOpacity>
          <Text style={s.modalTitle}>지역 설정</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.inputLabel}>내 거주지 기준</Text>
          <TouchableOpacity
            style={[s.regionBtn, !current && { borderColor: T.accent, backgroundColor: '#FFF8F0' }]}
            onPress={() => { onSelect(null); onClose(); }}
          >
            <Text style={{ color: !current ? T.accent : T.label1, fontWeight: '600' }}>
              {userLocation ? `거주지 기준 (${userLocation})` : '거주지 기준 (미설정)'}
            </Text>
          </TouchableOpacity>

          <Text style={[s.inputLabel, { marginTop: 20 }]}>빠른 선택</Text>
          {presets.map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.regionBtn, current === p && { borderColor: T.accent, backgroundColor: '#FFF8F0' }]}
              onPress={() => { onSelect(p); onClose(); }}
            >
              <Text style={{ color: current === p ? T.accent : T.label1, fontWeight: '500' }}>{p}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[s.inputLabel, { marginTop: 20 }]}>직접 입력</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={custom}
              onChangeText={setCustom}
              placeholder="예: 인천 연수구"
              placeholderTextColor="#C7C7CC"
            />
            <TouchableOpacity
              style={[s.regionBtn, { paddingHorizontal: 16, borderColor: T.accent }]}
              onPress={() => { if (custom.trim()) { onSelect(custom.trim()); onClose(); } }}
            >
              <Text style={{ color: T.accent, fontWeight: '700' }}>적용</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── 이벤트 카드
function EventCard({ event, onToggle }: { event: LightningWalk; onToggle: (event: LightningWalk) => void }) {
  const hasPin = event.location_lat && event.location_lng;
  return (
    <View style={s.eventCard}>
      <View style={s.eventTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.eventDate}>{new Date(event.starts_at).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={s.eventTitle}>{event.title}</Text>
          <Text style={s.eventLocation}>
            📍 {event.location}
            {hasPin && ' · 지도 위치 있음'}
          </Text>
          {event.region && <Text style={s.eventRegion}>🏘 {event.region}</Text>}
        </View>
        <View style={s.participantBadge}>
          <Text style={s.participantText}>{event.participant_count}/{event.max_participants}명</Text>
        </View>
      </View>

      {/* 지도 미리보기 */}
      {hasPin && (
        <View style={s.miniMapContainer}>
          <MapView
            style={s.miniMap}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: event.location_lat!,
              longitude: event.location_lng!,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Marker coordinate={{ latitude: event.location_lat!, longitude: event.location_lng! }} />
          </MapView>
        </View>
      )}

      <View style={s.summaryBox}>
        <Text style={s.summaryText}>{event.ai_summary || '참여자 정보가 쌓이면 산책 브리핑을 확인할 수 있습니다.'}</Text>
      </View>
      <View style={s.eventBottom}>
        <Text style={s.weatherText}>{event.weather || '날씨 확인 필요'}</Text>
        <TouchableOpacity
          style={[s.joinBtn, event.joined && { backgroundColor: T.fill2 }]}
          onPress={() => onToggle(event)}
        >
          <Text style={[s.joinBtnText, event.joined && { color: T.label4 }]}>
            {event.joined ? '참여 취소' : '참여하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── LightningScreen 본체
export function LightningScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const lightning = useLightningWalks();
  const walkLogs = useWalkLogs();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedJoinedWalks = selectedDate
    ? lightning.walks.filter((w) => w.starts_at.slice(0, 10) === selectedDate && w.joined)
    : [];
  const selectedOtherWalks = selectedDate
    ? lightning.walks.filter((w) => w.starts_at.slice(0, 10) === selectedDate && !w.joined)
    : [];

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const refresh = async () => { await lightning.refresh(); await walkLogs.refresh(); };

  const prevMonth = () => { month === 0 ? (setYear((y) => y - 1), setMonth(11)) : setMonth((m) => m - 1); setSelectedDate(null); };
  const nextMonth = () => { month === 11 ? (setYear((y) => y + 1), setMonth(0)) : setMonth((m) => m + 1); setSelectedDate(null); };

  const isToday = useCallback((key: string) => key === todayKey, [todayKey]);
  const isFuture = useCallback((key: string) => key >= todayKey, [todayKey]);

  return (
    <View style={s.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 헤더 */}
        <View style={s.header}>
          <Text style={s.headerTitle}>번개</Text>
          <TouchableOpacity style={s.regionFilterBtn} onPress={() => setShowRegionModal(true)}>
            <Text style={s.regionFilterText}>
              {lightning.regionFilter ? `${lightning.userLocation} + ${lightning.regionFilter}` : lightning.userLocation || '전체 지역'} ▾
            </Text>
          </TouchableOpacity>
        </View>

        {/* 월 네비게이션 */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}><Text style={s.navBtnText}>‹</Text></TouchableOpacity>
          <Text style={s.monthLabel}>{year}년 {MONTH_NAMES[month]}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn}><Text style={s.navBtnText}>›</Text></TouchableOpacity>
        </View>

        {/* 달력 */}
        <View style={s.calendarCard}>
          <View style={s.weekRow}>
            {WEEK_LABELS.map((d, i) => (
              <Text key={d} style={[s.weekLabel, i === 0 && { color: T.red }, i === 6 && { color: T.blue }]}>{d}</Text>
            ))}
          </View>
          <View style={s.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`empty-${idx}`} style={s.cell} />;
              const key = toKey(year, month, day);
              const walkMark = walkLogs.markedDates[key];
              const lightningCount = lightning.dateCountMap[key] || 0;
              const isSelected = key === selectedDate;
              const dayOfWeek = (firstDay + day - 1) % 7;
              const future = isFuture(key);

              return (
                <TouchableOpacity
                  key={key}
                  style={[s.cell, isSelected && s.cellSelected, isToday(key) && !isSelected && s.cellToday]}
                  onPress={() => setSelectedDate(isSelected ? null : key)}
                >
                  <Text style={[
                    s.dayText,
                    isSelected && { color: '#fff' },
                    isToday(key) && !isSelected && { color: T.accent, fontWeight: '700' },
                    dayOfWeek === 0 && !isSelected && { color: T.red },
                    dayOfWeek === 6 && !isSelected && { color: T.blue },
                  ]}>{day}</Text>

                  {walkMark && !isSelected && (
                    <View style={[s.dot, { backgroundColor: T.accent }]} />
                  )}

                  {future && lightningCount > 0 && !isSelected && (
                    <View style={s.countBadge}>
                      <Text style={s.countBadgeText}>{lightningCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={s.legend}>
            <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: T.accent }]} /><Text style={s.legendText}>산책 완료</Text></View>
            <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: '#FF9F0A', borderRadius: 3 }]} /><Text style={s.legendText}>번개 수</Text></View>
          </View>
        </View>

        {/* 선택한 날짜 정보 */}
        {selectedDate && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{selectedDate.replace(/-/g, '.')} 일정</Text>

            {selectedJoinedWalks.length > 0 && (
              <>
                <Text style={s.subSectionTitle}>✅ 내가 참여하는 번개</Text>
                {selectedJoinedWalks.map((event) => (
                  <EventCard key={event.id} event={event} onToggle={lightning.toggleJoin} />
                ))}
              </>
            )}

            {selectedOtherWalks.length > 0 && (
              <>
                <Text style={s.subSectionTitle}>⚡ 올라온 번개</Text>
                {selectedOtherWalks.map((event) => (
                  <EventCard key={event.id} event={event} onToggle={lightning.toggleJoin} />
                ))}
              </>
            )}

            {selectedJoinedWalks.length === 0 && selectedOtherWalks.length === 0 && (
              <EmptyText text="선택한 날짜에 등록된 번개가 없습니다." />
            )}
          </View>
        )}

        {/* 전체 예정 번개 목록 */}
        {!selectedDate && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>예정된 번개</Text>
            {lightning.loading
              ? <ActivityIndicator color={T.accent} />
              : lightning.walks.length
                ? lightning.walks.map((event) => <EventCard key={event.id} event={event} onToggle={lightning.toggleJoin} />)
                : <EmptyText text="현재 지역에 등록된 번개가 없습니다." />
            }
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setShowCreateModal(true)}>
        <Text style={s.fabText}>⚡ 번개 만들기</Text>
      </TouchableOpacity>

      {/* 번개 만들기 모달 */}
      <CreateLightningModal
        visible={showCreateModal}
        selectedDate={selectedDate}
        onClose={() => setShowCreateModal(false)}
        onSubmit={lightning.createWalk}
        userLocation={lightning.userLocation}
      />

      {/* 지역 필터 모달 */}
      <RegionFilterModal
        visible={showRegionModal}
        current={lightning.regionFilter}
        userLocation={lightning.userLocation}
        onSelect={lightning.setRegionFilter}
        onClose={() => setShowRegionModal(false)}
      />
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

// ── 스타일
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.fill1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: T.label1 },
  regionFilterBtn: {
    backgroundColor: T.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.fill2,
    marginBottom: 4,
  },
  regionFilterText: { fontSize: 13, color: T.accent, fontWeight: '600' },

  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: { fontSize: 28, color: T.accent },
  monthLabel: { fontSize: 19, fontWeight: '800', color: T.label1 },

  calendarCard: {
    margin: 16,
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: T.label4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  cellSelected: { backgroundColor: T.accent },
  cellToday: { backgroundColor: '#FFF3E0' },
  dayText: { fontSize: 15, color: T.label1 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  countBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF9F0A',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: { fontSize: 8, fontWeight: '800', color: T.white },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: T.label4 },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T.label1, marginBottom: 10 },
  subSectionTitle: { fontSize: 14, fontWeight: '700', color: T.label3, marginBottom: 8, marginTop: 4 },

  eventCard: {
    backgroundColor: T.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventDate: { fontSize: 13, color: T.accent, fontWeight: '700', marginBottom: 3 },
  eventTitle: { fontSize: 17, fontWeight: '700', color: T.label1, marginBottom: 5 },
  eventLocation: { fontSize: 13, color: T.label4, marginBottom: 4 },
  eventRegion: { fontSize: 12, color: T.blue, fontWeight: '600', marginBottom: 6 },
  participantBadge: { backgroundColor: '#FFF3E0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  participantText: { fontSize: 12, fontWeight: '700', color: T.accent },

  miniMapContainer: { height: 120, borderRadius: 12, overflow: 'hidden', marginVertical: 10 },
  miniMap: { flex: 1 },

  summaryBox: { backgroundColor: T.fill1, padding: 12, borderRadius: 12, marginBottom: 10 },
  summaryText: { fontSize: 12, color: T.label2, lineHeight: 18 },
  eventBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherText: { fontSize: 13, fontWeight: '600', color: T.label1, flex: 1 },
  joinBtn: {
    backgroundColor: T.accent,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
  },
  joinBtnText: { color: T.white, fontSize: 14, fontWeight: '700' },

  emptyCard: { backgroundColor: T.white, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 12 },
  emptyText: { color: T.label4, fontSize: 13 },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: T.accent,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: T.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: T.white, fontSize: 15, fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: T.fill1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: T.white,
    borderBottomWidth: 0.5,
    borderBottomColor: T.fill2,
  },
  modalCancel: { fontSize: 15, color: T.label4 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: T.label1 },
  modalSave: { fontSize: 15, color: T.accent, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: T.label4, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: T.white, borderRadius: 12, padding: 14, fontSize: 15, color: T.label1 },
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: T.fill2,
    borderStyle: 'dashed',
  },
  mapPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: T.white,
    borderBottomWidth: 0.5,
    borderBottomColor: T.fill2,
  },
  mapPickerHint: {
    textAlign: 'center',
    fontSize: 13,
    color: T.label4,
    paddingVertical: 10,
    backgroundColor: T.fill1,
  },
  infoBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  infoText: { fontSize: 13, color: T.accent, fontWeight: '500' },
  regionBtn: {
    backgroundColor: T.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: T.fill2,
  },
});

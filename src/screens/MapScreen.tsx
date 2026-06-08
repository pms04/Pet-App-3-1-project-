import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Alert, Animated,
  StatusBar, Platform, TextInput, Modal, ScrollView,
  StyleSheet,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { styles, T } from '../styles/styles';
import { WeatherWidget } from '../components/WeatherWidget';
import { gradeColor } from '../utils/compatScore';
import { useNearbyDogs, NearbyDog } from '../hooks/useNearbyDogs';
import { useWalkLogs } from '../hooks/useWalkLogs';
import { usePetFacilities, PetFacility } from '../hooks/usePetFacilities';
import { requireCurrentUser, showError } from '../lib/supabaseApi';
import { supabase } from '../../supabase';

interface PathSegment {
  id: string;
  points: { latitude: number; longitude: number }[];
  color: string;
}

interface SharedPin {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  createdAt: number;
  ownerNickname: string;
  expiresAt: number;
}

const QUICK_TAGS = ['똥 조심', '그늘 많음', '물 있음', '경사 있음', '강아지 친화', '주의 필요'];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function flattenPath(segments: PathSegment[]) {
  const points = segments.flatMap((s) => s.points);
  return points.filter((p, i) => i === 0 || p.latitude !== points[i - 1].latitude || p.longitude !== points[i - 1].longitude);
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── 강아지 선택 모달
function DogSelectModal({
  visible, dogs, selectedIds, onToggle, onConfirm, onClose,
}: {
  visible: boolean;
  dogs: { id: string; name: string; breed: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={ms.modalContainer}>
        <View style={ms.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={ms.modalCancel}>취소</Text></TouchableOpacity>
          <Text style={ms.modalTitle}>함께 산책할 반려견 선택</Text>
          <TouchableOpacity onPress={onConfirm}><Text style={ms.modalSave}>시작</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 14, color: T.label4, marginBottom: 16, lineHeight: 20 }}>
            산책 중 지도에 표시될 반려견을 선택해 주세요. (복수 선택 가능)
          </Text>
          {dogs.map((dog) => {
            const selected = selectedIds.includes(dog.id);
            return (
              <TouchableOpacity
                key={dog.id}
                style={[ms.dogSelectRow, selected && ms.dogSelectRowActive]}
                onPress={() => onToggle(dog.id)}
                activeOpacity={0.8}
              >
                <View style={ms.dogSelectCheck}>
                  {selected && <Text style={{ color: T.white, fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ms.dogSelectName, selected && { color: T.accent }]}>{dog.name}</Text>
                  <Text style={ms.dogSelectBreed}>{dog.breed}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── 공유 마커 작성 모달
function SharedPinModal({
  visible, onClose, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (desc: string) => void;
}) {
  const [desc, setDesc] = useState('');
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={ms.pinOverlay}>
        <View style={ms.pinCard}>
          <Text style={ms.pinTitle}>장소 정보 공유</Text>
          <Text style={ms.pinSub}>현재 위치에 대한 정보를 주변 산책자들과 공유합니다. (30초 후 자동 삭제)</Text>
          <View style={ms.quickTagRow}>
            {QUICK_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[ms.quickTag, desc === tag && ms.quickTagActive]}
                onPress={() => setDesc(tag)}
              >
                <Text style={[ms.quickTagText, desc === tag && { color: T.white }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={ms.pinInput}
            placeholder="직접 입력..."
            placeholderTextColor={T.label4}
            value={desc}
            onChangeText={setDesc}
            maxLength={40}
          />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={[ms.pinBtn, { backgroundColor: T.fill2 }]} onPress={onClose}>
              <Text style={{ color: T.label1, fontWeight: '600' }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ms.pinBtn, { backgroundColor: T.accent, flex: 1 }]}
              onPress={() => { if (desc.trim()) { onSubmit(desc.trim()); setDesc(''); } }}
            >
              <Text style={{ color: T.white, fontWeight: '700' }}>공유하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 마커 상세 모달
function DogDetailModal({
  dog, visible, onClose, onRequestWalk, onChat, onViewProfile, onAddFriend,
}: {
  dog: NearbyDog | null;
  visible: boolean;
  onClose: () => void;
  onRequestWalk: (dog: NearbyDog) => void;
  onChat: (dog: NearbyDog) => void;
  onViewProfile: (dog: NearbyDog) => void;
  onAddFriend: (dog: NearbyDog) => void;
}) {
  if (!dog) return null;
  const color = gradeColor(dog.grade);
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={ms.pinOverlay}>
        <View style={ms.detailCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[ms.gradeCircle, { backgroundColor: color }]}>
              <Text style={{ color: T.white, fontSize: 13, fontWeight: '800' }}>{dog.score}%</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ms.detailDogName}>{dog.name}</Text>
              <Text style={ms.detailOwner}>{dog.ownerNickname} · {dog.breed}</Text>
              <Text style={[ms.detailGrade, { color }]}>
                {dog.grade === 'safe' ? '궁합 좋음' : dog.grade === 'caution' ? '보통' : '주의 필요'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[ms.detailBtn, { backgroundColor: T.accent }]} onPress={() => { onRequestWalk(dog); onClose(); }}>
            <Text style={ms.detailBtnText}>🐾 산책 신청하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ms.detailBtn, { backgroundColor: '#007AFF' }]} onPress={() => { onChat(dog); onClose(); }}>
            <Text style={ms.detailBtnText}>💬 대화하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ms.detailBtn, { backgroundColor: T.fill2 }]} onPress={() => { onViewProfile(dog); onClose(); }}>
            <Text style={[ms.detailBtnText, { color: T.label1 }]}>👤 프로필 보기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ms.detailBtn, { backgroundColor: T.fill2 }]} onPress={() => { onAddFriend(dog); onClose(); }}>
            <Text style={[ms.detailBtnText, { color: T.label1 }]}>➕ 친구 신청</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.detailCloseBtn} onPress={onClose}>
            <Text style={{ color: T.label4, fontSize: 14 }}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── MapScreen 본체
export function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [segments, setSegments] = useState<PathSegment[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [walkElapsed, setWalkElapsed] = useState<number>(0);

  // 강아지 선택
  const [myDogs, setMyDogs] = useState<{ id: string; name: string; breed: string }[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [showDogSelectModal, setShowDogSelectModal] = useState(false);

  // 공유 마커 (실시간 동기화)
  const [sharedPins, setSharedPins] = useState<SharedPin[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);
  const sharedPinsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 마커 상세
  const [selectedDog, setSelectedDog] = useState<NearbyDog | null>(null);
  const [showDogDetail, setShowDogDetail] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<PetFacility | null>(null);
  const [showFacilityDetail, setShowFacilityDetail] = useState(false);

  const lastCoordRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const walkStartedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const morphAnim = useRef(new Animated.Value(0)).current;
  const { saveWalkLog } = useWalkLogs();
  const {
    nearbyDogs, message: nearbyMessage, refresh: refreshDogs,
    publishMyLocation, removeMyLocation,
  } = useNearbyDogs(location, isWalking, selectedDogIds);
  const { facilities, searchQuery: facilitySearchQuery, setSearchQuery: setFacilitySearchQuery } = usePetFacilities(location, 2);

  // ── 내 강아지 목록 로드
  useEffect(() => {
    (async () => {
      try {
        const user = await requireCurrentUser();
        const { data } = await supabase.from('dogs').select('id,name,breed').eq('user_id', user.id);
        if (data) setMyDogs(data);
      } catch (_) {}
    })();
  }, []);

  // ── 산책 타이머
  useEffect(() => {
    if (isWalking) {
      timerRef.current = setInterval(() => setWalkElapsed((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setWalkElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isWalking]);

  // ── 내 위치 실시간 발행 (산책 중)
  useEffect(() => {
    if (!isWalking || !location) return;
    publishMyLocation(location, selectedDogIds);
  }, [location, isWalking, selectedDogIds, publishMyLocation]);

  // ── 공유 마커 Realtime 구독 (산책 중)
  useEffect(() => {
    if (!isWalking) {
      if (sharedPinsChannelRef.current) {
        supabase.removeChannel(sharedPinsChannelRef.current);
        sharedPinsChannelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel('shared_pins_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_pins',
      }, () => {
        // 공유 마커 갱신 로직 (선택사항)
      })
      .subscribe();

    sharedPinsChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      sharedPinsChannelRef.current = null;
    };
  }, [isWalking]);

  // ── 공유 마커 만료 처리 (30초)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSharedPins((prev) => prev.filter((p) => now < p.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const resetWalk = useCallback(() => {
    setSegments([]);
    setTotalDistance(0);
    setIsWalking(false);
    setWalkElapsed(0);
    walkStartedAtRef.current = null;
    removeMyLocation();
  }, [removeMyLocation]);

  // ── 마커 터치 핸들러
  const handleMarkerPress = useCallback((dog: NearbyDog) => {
    setSelectedDog(dog);
    setShowDogDetail(true);
  }, []);

  // ── 산책 신청
  const handleRequestWalk = useCallback(async (dog: NearbyDog) => {
    try {
      const user = await requireCurrentUser();
      const { data: room, error: roomError } = await supabase.from('chat_rooms').insert({}).select('id').single();
      if (roomError) throw roomError;
      await supabase.from('chat_room_members').insert([
        { room_id: room.id, user_id: user.id },
        { room_id: room.id, user_id: dog.user_id },
      ]);
      await supabase.from('messages').insert({
        room_id: room.id,
        sender_id: user.id,
        content: `${dog.name}와 함께 산책하고 싶어요! 🐾`,
      });
      Alert.alert('신청 완료', '산책 신청 메시지가 전송되었습니다.');
    } catch (error) {
      showError('산책 신청 실패', error);
    }
  }, []);

  // ── 대화하기
  const handleChat = useCallback(async (dog: NearbyDog) => {
    try {
      const user = await requireCurrentUser();
      const { data: myRooms } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', user.id);
      const myRoomIds = (myRooms || []).map((r: any) => r.room_id);
      const { data: targetRooms } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', dog.user_id)
        .in('room_id', myRoomIds);
      if (targetRooms && targetRooms.length > 0) {
        Alert.alert('대화하기', '이미 채팅방이 있습니다.');
        return;
      }
      const { data: room, error } = await supabase.from('chat_rooms').insert({}).select('id').single();
      if (error) throw error;
      await supabase.from('chat_room_members').insert([
        { room_id: room.id, user_id: user.id },
        { room_id: room.id, user_id: dog.user_id },
      ]);
      Alert.alert('채팅방 생성', '대화를 시작해 주세요.');
    } catch (error) {
      showError('채팅방 생성 실패', error);
    }
  }, []);

  // ── 프로필 보기 (친구 여부 상관없이 공개)
  const handleViewProfile = useCallback((dog: NearbyDog) => {
    Alert.alert(
      `${dog.ownerNickname}님의 프로필`,
      `반려견: ${dog.name} (${dog.breed})\n궁합 점수: ${dog.score}%\n체중: ${dog.weight}kg\n성향: ${dog.tendency}`,
      [
        { text: '닫기', style: 'cancel' },
        { text: '친구 신청', onPress: () => handleAddFriend(dog) },
      ],
    );
  }, []);

  // ── 친구 신청
  const handleAddFriend = useCallback(async (dog: NearbyDog) => {
    try {
      const user = await requireCurrentUser();
      const { error } = await supabase.from('friends').insert({
        requester_id: user.id,
        addressee_id: dog.user_id,
        status: 'pending',
      });
      if (error) {
        if (error.code === '23505') {
          Alert.alert('알림', '이미 친구 신청을 보냈거나 친구 관계입니다.');
        } else {
          throw error;
        }
        return;
      }
      Alert.alert('친구 신청 완료', `${dog.ownerNickname}님에게 친구 신청을 보냈습니다.`);
    } catch (error) {
      showError('친구 신청 실패', error);
    }
  }, []);

  // ── 공유 마커 추가
  const handleAddSharedPin = useCallback(async (desc: string) => {
    if (!location) return;
    try {
      const user = await requireCurrentUser();
      const { data: userData } = await supabase.from('users').select('nickname').eq('id', user.id).single();
      const pin: SharedPin = {
        id: Date.now().toString(),
        latitude: location.latitude,
        longitude: location.longitude,
        description: desc,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30_000,
        ownerNickname: userData?.nickname || '나',
      };
      setSharedPins((prev) => [...prev, pin]);
      setShowPinModal(false);
    } catch (_) {
      setShowPinModal(false);
    }
  }, [location]);

  // ── GPS 위치 추적
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const initPoint = { latitude: initialLocation.coords.latitude, longitude: initialLocation.coords.longitude };
      setLocation(initPoint);
      lastCoordRef.current = initPoint;
      lastTimestampRef.current = initialLocation.timestamp;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 3 },
        (newLocation) => {
          const { latitude, longitude, speed, accuracy } = newLocation.coords;
          const { timestamp } = newLocation;
          const newPoint = { latitude, longitude };
          const speedKmH = speed && speed > 0 ? parseFloat((speed * 3.6).toFixed(1)) : 0;
          setCurrentSpeed(speedKmH);
          setLocation(newPoint);

          if (!isWalking) return;
          if (speedKmH <= 1.0) return;
          if (accuracy && accuracy > 25) return;

          if (lastCoordRef.current && lastTimestampRef.current) {
            const dist = getDistance(lastCoordRef.current.latitude, lastCoordRef.current.longitude, latitude, longitude);
            if (dist < 5) return;
            const timeDiffSec = (timestamp - lastTimestampRef.current) / 1000;
            if (timeDiffSec > 0 && (dist / timeDiffSec) * 3.6 > 30) return;
            setTotalDistance((prev) => prev + (dist / 1000));
          }

          lastCoordRef.current = newPoint;
          lastTimestampRef.current = timestamp;
          const targetColor = speedKmH <= 4 ? '#30D158' : '#FF9F0A';
          setSegments((prevSegments) => {
            if (prevSegments.length === 0) return [{ id: '1', points: [newPoint], color: targetColor }];
            const lastSegment = prevSegments[prevSegments.length - 1];
            if (lastSegment.color === targetColor) {
              return [...prevSegments.slice(0, -1), { ...lastSegment, points: [...lastSegment.points, newPoint] }];
            }
            const lastPoint = lastSegment.points[lastSegment.points.length - 1];
            return [...prevSegments, { id: Date.now().toString(), points: [lastPoint, newPoint], color: targetColor }];
          });
        },
      );
    })();
    return () => { if (subscription) subscription.remove(); };
  }, [isWalking]);

  const startWalkTransition = useCallback(() => {
    if (myDogs.length > 0) {
      setShowDogSelectModal(true);
    } else {
      Alert.alert('반려견 등록 필요', '먼저 프로필 탭에서 반려견을 등록해 주세요.');
    }
  }, [myDogs]);

  const beginWalk = useCallback((dogIds: string[]) => {
    setSelectedDogIds(dogIds);
    setIsWalking(true);
    walkStartedAtRef.current = Date.now();
    if (location) {
      lastCoordRef.current = location;
      lastTimestampRef.current = Date.now();
      setSegments([{ id: '1', points: [location], color: '#30D158' }]);
    }
    Animated.spring(morphAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: false }).start();
    if (location && mapRef.current) mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.001, longitudeDelta: 0.001 }, 1500);
  }, [location, morphAnim]);

  const handleStopWalking = useCallback(() => {
    Alert.alert('산책 종료', '오늘의 산책 기록을 저장하시겠습니까?', [
      {
        text: '저장 안 함',
        style: 'destructive',
        onPress: () => Animated.timing(morphAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start(resetWalk),
      },
      {
        text: '기록 저장',
        onPress: async () => {
          const durationSec = walkStartedAtRef.current ? Math.round((Date.now() - walkStartedAtRef.current) / 1000) : 0;
          const ok = await saveWalkLog(totalDistance, durationSec, flattenPath(segments), selectedDogIds);
          if (ok) Animated.timing(morphAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start(resetWalk);
        },
      },
    ]);
  }, [morphAnim, resetWalk, saveWalkLog, totalDistance, segments, selectedDogIds]);

  const baseTopPosition = Platform.OS === 'ios' ? 60 : 20;
  const searchBarY = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [baseTopPosition, -100] });
  const searchBarOpacity = morphAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0] });
  const dashboardY = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [-150, baseTopPosition] });
  const cardBgColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255, 255, 255, 0.95)', 'rgba(28, 28, 30, 0.95)'] });
  const textColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['#000000', '#30D158'] });
  const subTextColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['#888888', '#8E8E93'] });
  const navIconColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['#007AFF', '#30D158'] });
  const buttonPanelX = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -85] });
  const timerY = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, baseTopPosition + 80] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isWalking ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ ...location, latitudeDelta: 0.003, longitudeDelta: 0.003 }}
          showsUserLocation
          provider={PROVIDER_DEFAULT}
          userInterfaceStyle={isWalking ? 'dark' : 'light'}
          showsPointsOfInterest
          onLongPress={isWalking ? () => setShowPinModal(true) : undefined}
        >
          {/* 산책 경로 */}
          {isWalking && segments.map((seg) => (
            <Polyline key={seg.id} coordinates={seg.points} strokeColor={seg.color} strokeWidth={6} />
          ))}

          {/* 반려동물 시설 마커 (비산책 모드에서만) */}
          {!isWalking && facilities.map((facility, idx) => (
            <Marker
              key={`facility-${facility.name}-${idx}`}
              coordinate={{ latitude: facility.lat, longitude: facility.lng }}
              onPress={() => {
                setSelectedFacility(facility);
                setShowFacilityDetail(true);
              }}
            >
              <View style={{
                backgroundColor: '#FF6B6B',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>🏛</Text>
                <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>{facility.name.slice(0, 8)}</Text>
              </View>
            </Marker>
          ))}

          {/* 주변 강아지 마커 (산책 모드에서만) */}
          {isWalking && nearbyDogs.map((dog) => {
            const color = gradeColor(dog.grade);
            return (
              <Marker
                key={`${dog.id}-${dog.user_id}`}
                coordinate={{ latitude: dog.latitude, longitude: dog.longitude }}
                onPress={() => handleMarkerPress(dog)}
              >
                <View style={{
                  backgroundColor: color,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{dog.score}% 궁합</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>{dog.name}</Text>
                </View>
              </Marker>
            );
          })}

          {/* 공유 마커 (산책 중, 30초 표시) */}
          {isWalking && sharedPins.map((pin) => (
            <Marker key={pin.id} coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}>
              <View style={ms.sharedPinMarker}>
                <Text style={{ fontSize: 16 }}>📍</Text>
                <Text style={ms.sharedPinText}>{pin.description}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* 검색창 (비산책 모드) */}
      <Animated.View style={[styles.searchBarFloatingContainer, { transform: [{ translateY: searchBarY }], opacity: searchBarOpacity }]}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.vectorSearchIconWrapper}>
            <View style={styles.vectorSearchCircle} />
            <View style={styles.vectorSearchLine} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="동물병원, 반려견 카페 검색..."
            placeholderTextColor="#8E8E93"
            value={facilitySearchQuery}
            onChangeText={setFacilitySearchQuery}
            returnKeyType="search"
          />
        </View>
      </Animated.View>

      {/* 대시보드 (산책 모드) */}
      <Animated.View style={[styles.dashboardCard, { backgroundColor: cardBgColor, transform: [{ translateY: dashboardY }] }]}>
        <View style={styles.dashboardRow}>
          <View style={styles.dashboardItem}>
            <Animated.Text style={[styles.dashboardValue, { color: textColor }]}>
              {totalDistance.toFixed(2)}<Text style={{ fontSize: 12 }}> km</Text>
            </Animated.Text>
            <Animated.Text style={[styles.dashboardLabel, { color: subTextColor }]}>거리</Animated.Text>
          </View>
          <View style={[styles.dashboardItem, { borderLeftWidth: 1, borderLeftColor: isWalking ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Animated.Text style={[styles.dashboardValue, { color: textColor }]}>
              {currentSpeed}<Text style={{ fontSize: 12 }}> km/h</Text>
            </Animated.Text>
            <View style={styles.paceContainer}>
              {isWalking && <View style={[styles.paceDot, { backgroundColor: currentSpeed <= 4 ? '#0A84FF' : '#FF9F0A' }]} />}
              <Animated.Text style={[styles.dashboardLabel, { color: subTextColor, marginTop: 0 }]}>
                {isWalking ? (currentSpeed <= 4 ? '안정 페이스' : '러닝 페이스') : '현재 속도'}
              </Animated.Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 산책 타이머 */}
      {isWalking && (
        <Animated.View style={[styles.walkTimerContainer, { top: timerY }]}>
          <View style={{ backgroundColor: 'rgba(28,28,30,0.85)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={styles.walkTimerText}>⏱ {formatDuration(walkElapsed)}</Text>
          </View>
        </Animated.View>
      )}

      {/* 내 위치 버튼 */}
      <Animated.View style={[styles.myLocationFloatingContainer, { backgroundColor: cardBgColor }]}>
        <TouchableOpacity
          style={styles.myLocationButton_apple}
          onPress={() => { if (location && mapRef.current) mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.0015, longitudeDelta: 0.0015 }, 800); }}
        >
          <Animated.View style={[styles.arrowIcon_apple, { borderBottomColor: navIconColor }]} />
        </TouchableOpacity>
      </Animated.View>

      {/* 날씨 위젯 (비산책 모드) */}
      {!isWalking && <WeatherWidget location={location} />}

      {/* 공유 마커 버튼 (산책 모드) */}
      {isWalking && (
        <TouchableOpacity
          style={ms.pinFab}
          onPress={() => setShowPinModal(true)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20 }}>📍</Text>
        </TouchableOpacity>
      )}

      {/* 산책 시작/종료 버튼 */}
      <View style={styles.floatingButtonPanel}>
        <Animated.View style={[styles.actionControlsWrapper, { transform: [{ translateX: buttonPanelX }] }]}>
          <View style={{ width: isWalking ? '78%' : '100%' }}>
            {!isWalking
              ? <TouchableOpacity style={styles.startButton} onPress={startWalkTransition} activeOpacity={0.8}>
                  <Text style={styles.startButtonText}>산책 시작하기</Text>
                </TouchableOpacity>
              : <View style={[styles.walkingStatusBadge, { width: '100%' }]}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#30D158' }}>기록 중</Text>
                </View>
            }
          </View>
          {isWalking && (
            <Animated.View style={{ backgroundColor: cardBgColor, width: 75, height: 52, borderRadius: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', marginLeft: 10 }}>
              <TouchableOpacity style={styles.stopButton} onPress={handleStopWalking} activeOpacity={0.8}>
                <Text style={styles.stopButtonText}>종료</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>

      {/* 모달들 */}
      <DogSelectModal
        visible={showDogSelectModal}
        dogs={myDogs}
        selectedIds={selectedDogIds}
        onToggle={(id) => setSelectedDogIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
        onConfirm={() => { setShowDogSelectModal(false); beginWalk(selectedDogIds); }}
        onClose={() => setShowDogSelectModal(false)}
      />

      <SharedPinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handleAddSharedPin}
      />

      <DogDetailModal
        dog={selectedDog}
        visible={showDogDetail}
        onClose={() => setShowDogDetail(false)}
        onRequestWalk={handleRequestWalk}
        onChat={handleChat}
        onViewProfile={handleViewProfile}
        onAddFriend={handleAddFriend}
      />

      {/* 문화시설 상세 정보 모달 */}
      <Modal visible={showFacilityDetail} animationType="fade" transparent onRequestClose={() => setShowFacilityDetail(false)}>
        <View style={ms.pinOverlay}>
          <View style={ms.detailCard}>
            <Text style={[ms.detailDogName, { color: '#FF6B6B' }]}>🏛 {selectedFacility?.name}</Text>
            <Text style={ms.detailOwner}>{selectedFacility?.category}</Text>
            
            <View style={{ marginVertical: 15, backgroundColor: T.fill1, padding: 12, borderRadius: 12 }}>
              <Text style={{ fontSize: 13, color: T.label1, marginBottom: 6 }}>📍 {selectedFacility?.address}</Text>
              {selectedFacility?.phone && <Text style={{ fontSize: 13, color: T.label1, marginBottom: 6 }}>📞 {selectedFacility?.phone}</Text>}
              {selectedFacility?.time && <Text style={{ fontSize: 13, color: T.label1 }}>⏰ {selectedFacility?.time}</Text>}
            </View>

            <TouchableOpacity style={[ms.detailBtn, { backgroundColor: '#FF6B6B' }]} onPress={() => setShowFacilityDetail(false)}>
              <Text style={ms.detailBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── 지역 스타일
const ms = StyleSheet.create({
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
  dogSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dogSelectRowActive: { borderColor: T.accent, backgroundColor: '#FFF8F0' },
  dogSelectCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.fill2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dogSelectName: { fontSize: 16, fontWeight: '700', color: T.label1 },
  dogSelectBreed: { fontSize: 13, color: T.label4, marginTop: 2 },

  pinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 40,
  },
  pinCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 20,
  },
  pinTitle: { fontSize: 18, fontWeight: '700', color: T.label1, marginBottom: 6 },
  pinSub: { fontSize: 13, color: T.label4, marginBottom: 14, lineHeight: 18 },
  quickTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  quickTag: {
    backgroundColor: T.fill1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.fill2,
  },
  quickTagActive: { backgroundColor: T.accent, borderColor: T.accent },
  quickTagText: { fontSize: 13, color: T.label1, fontWeight: '500' },
  pinInput: {
    backgroundColor: T.fill1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: T.label1,
  },
  pinBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sharedPinMarker: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 100,
  },
  sharedPinText: { fontSize: 10, color: T.label1, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  detailCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 20,
  },
  gradeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailDogName: { fontSize: 18, fontWeight: '700', color: T.label1 },
  detailOwner: { fontSize: 13, color: T.label4, marginTop: 2 },
  detailGrade: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  detailBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  detailBtnText: { color: T.white, fontSize: 15, fontWeight: '700' },
  detailCloseBtn: { alignItems: 'center', paddingVertical: 8 },

  pinFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 170 : 160,
    right: 15,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28,28,30,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Animated, StatusBar, Platform, TextInput } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { styles } from '../styles/styles';
import { WeatherWidget } from '../components/WeatherWidget';
import { calcCompatScore, gradeColor, DogProfile } from '../utils/compatScore';
import { NEARBY_DOGS, MY_DOG_PROFILE } from '../constants/mockData';

// ==========================================
// MapScreen
// ==========================================
interface PathSegment {
  id: string;
  points: { latitude: number; longitude: number }[];
  color: string;
}

const SAMPLE_POI = [
  { id: 'poi1', title: '바른 동물병원', desc: '리뷰 4.9 | 24시 운영', offsetLat: 0.0015, offsetLng: -0.001, icon: '🏥' },
  { id: 'poi2', title: '멍멍 멍카페', desc: '리뷰 4.7 | 운동장 보유', offsetLat: -0.001, offsetLng: 0.0018, icon: '☕' },
  { id: 'poi3', title: '퍼피굿즈 애견숍', desc: '리뷰 4.5 | 필수 수입약 보유', offsetLat: 0.0008, offsetLng: -0.0015, icon: '🍒' },
];

export function MapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [segments, setSegments] = useState<PathSegment[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);

  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const lastCoordRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleRequestWalk = (dogName: string) => {
    Alert.alert(
      "산책 신청",
      `${dogName}님에게 함께 산책하기를 신청하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "신청하기", onPress: () => Alert.alert("신청 완료", "산책 신청이 전송되었습니다. 상대방이 수락하면 채팅방이 개설됩니다.") }
      ]
    );
  };

  const morphAnim = useRef(new Animated.Value(0)).current;

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  useEffect(() => {
    let subscription: any = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
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

          if (isWalking) {
            if (speedKmH <= 1.0) return;
            if (accuracy && accuracy > 25) return;

            if (lastCoordRef.current && lastTimestampRef.current) {
              const dist = getDistance(lastCoordRef.current.latitude, lastCoordRef.current.longitude, latitude, longitude);
              if (dist < 5) return;

              const timeDiffSec = (timestamp - lastTimestampRef.current) / 1000;
              if (timeDiffSec > 0) {
                const calculatedSpeedKmH = (dist / timeDiffSec) * 3.6;
                if (calculatedSpeedKmH > 30) return;
              }
              setTotalDistance((prev) => prev + (dist / 1000));
            }

            lastCoordRef.current = newPoint;
            lastTimestampRef.current = timestamp;

            const targetColor = speedKmH <= 4 ? '#30D158' : '#FF9F0A';

            setSegments((prevSegments: PathSegment[]) => {
              if (prevSegments.length === 0) { return [{ id: '1', points: [newPoint], color: targetColor }]; }
              const lastSegment = prevSegments[prevSegments.length - 1];
              if (lastSegment.color === targetColor) {
                const updatedLast = { ...lastSegment, points: [...lastSegment.points, newPoint] };
                return [...prevSegments.slice(0, -1), updatedLast];
              } else {
                const lastPoint = lastSegment.points[lastSegment.points.length - 1];
                return [...prevSegments, { id: Date.now().toString(), points: [lastPoint, newPoint], color: targetColor }];
              }
            });
          }
        }
      );
    })();

    return () => { if (subscription) subscription.remove(); };
  }, [isWalking]);

  const startWalkTransition = () => {
    setIsWalking(true);
    Animated.spring(morphAnim, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.001, longitudeDelta: 0.001 }, 1500);
    }
  };

  const handleStopWalking = () => {
    Alert.alert(
      "산책 종료",
      "오늘의 GPS 코스 데이터를 피드에 공유하시겠습니까?",
      [
        {
          text: "저장안함",
          style: "destructive",
          onPress: () => {
            Animated.timing(morphAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
              setSegments([]); setTotalDistance(0); setIsWalking(false);
            });
          }
        },
        {
          text: "코스 저장",
          style: "default",
          onPress: () => {
            console.log(JSON.stringify(segments));
            Animated.timing(morphAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
              Alert.alert("저장 완료"); setSegments([]); setTotalDistance(0); setIsWalking(false);
            });
          }
        }
      ]
    );
  };

  const baseTopPosition = Platform.OS === 'ios' ? 60 : 20;
  const searchBarY = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [baseTopPosition, -100] });
  const searchBarOpacity = morphAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0] });
  const dashboardY = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [-150, baseTopPosition] });
  const cardBgColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255, 255, 255, 0.95)', 'rgba(28, 28, 30, 0.95)'] });
  const textColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['#000000', '#30D158'] });
  const subTextColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['#888888', '#8E8E93'] });
  const navIconColor = morphAnim.interpolate({ inputRange: [0, 1], outputRange: ['#007AFF', '#30D158'] });
  const buttonPanelX = morphAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -85] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isWalking ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ ...location, latitudeDelta: 0.003, longitudeDelta: 0.003 }}
          showsUserLocation={true}
          provider={PROVIDER_DEFAULT}
          userInterfaceStyle={isWalking ? 'dark' : 'light'}
          showsPointsOfInterest={false}
        >
          {isWalking && segments.map((seg: PathSegment) => (
            <Polyline key={seg.id} coordinates={seg.points} strokeColor={seg.color} strokeWidth={6} />
          ))}
          {!isWalking && SAMPLE_POI.map((poi) => (
            <Marker key={poi.id} coordinate={{ latitude: location.latitude + poi.offsetLat, longitude: location.longitude + poi.offsetLng }}>
                <View style={styles.poiMarkerContainer}><Text style={styles.poiMarkerIcon}>{poi.icon}</Text></View>
            </Marker>
          ))}
          {NEARBY_DOGS.map((dog) => {
            const result = calcCompatScore(MY_DOG_PROFILE, dog.profile);
            const color = gradeColor(result.grade);
            return (
              <Marker
                key={dog.id}
                coordinate={{
                  latitude: location.latitude + dog.offsetLat,
                  longitude: location.longitude + dog.offsetLng,
                }}
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
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                    {result.score}% 궁합
                  </Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>
                    {dog.name}
                  </Text>
                </View>
                <Callout tooltip onPress={() => handleRequestWalk(dog.name)}>
                  <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 10,
                    width: 150,
                    borderWidth: 1,
                    borderColor: '#eee',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{dog.name}</Text>
                    <Text style={{ fontSize: 12, color: '#666', marginVertical: 4 }}>궁합 점수: {result.score}%</Text>
                    <View style={{
                      backgroundColor: '#007AFF',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      marginTop: 4
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>산책 신청하기</Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      )}

      <Animated.View style={[styles.searchBarFloatingContainer, { transform: [{ translateY: searchBarY }], opacity: searchBarOpacity }]}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.vectorSearchIconWrapper}><View style={styles.vectorSearchCircle} /><View style={styles.vectorSearchLine} /></View>
          <TextInput style={styles.searchInput} placeholder="동물병원, 반려견 카페 검색..." placeholderTextColor="#8E8E93" value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.dashboardCard, { backgroundColor: cardBgColor, transform: [{ translateY: dashboardY }] }]}>
        <View style={styles.dashboardRow}>
            <View style={styles.dashboardItem}>
                <Animated.Text style={[styles.dashboardValue, { color: textColor }]}>{totalDistance.toFixed(2)}<Text style={{fontSize: 12}}> km</Text></Animated.Text>
                <Animated.Text style={[styles.dashboardLabel, { color: subTextColor }]}>거리</Animated.Text>
            </View>
            <View style={[styles.dashboardItem, {borderLeftWidth: 1, borderLeftColor: isWalking ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}]}>
                <Animated.Text style={[styles.dashboardValue, { color: textColor }]}>{currentSpeed}<Text style={{fontSize: 12}}> km/h</Text></Animated.Text>
                <View style={styles.paceContainer}>
                  {isWalking && <View style={[styles.paceDot, { backgroundColor: currentSpeed <= 4 ? '#0A84FF' : '#FF9F0A' }]} />}
                  <Animated.Text style={[styles.dashboardLabel, { color: subTextColor, marginTop: 0 }]}>{isWalking ? (currentSpeed <= 4 ? '안정 페이스' : '러닝 페이스') : '현재 속도'}</Animated.Text>
                </View>
            </View>
        </View>
      </Animated.View>

      {/* ── 요구사항 5: 내 위치 버튼 + 날씨 위젯 (산책 중 아닐 때만 표시) ── */}
      <Animated.View style={[styles.myLocationFloatingContainer, { backgroundColor: cardBgColor }]}>
        <TouchableOpacity style={styles.myLocationButton_apple} onPress={() => { if (location && mapRef.current) mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.0015, longitudeDelta: 0.0015 }, 800); }}>
            <Animated.View style={[styles.arrowIcon_apple, { borderBottomColor: navIconColor }]} />
        </TouchableOpacity>
      </Animated.View>

      {!isWalking && (
        <WeatherWidget location={location} />
      )}

      <View style={styles.floatingButtonPanel}>
        <Animated.View style={[styles.actionControlsWrapper, { transform: [{ translateX: buttonPanelX }] }]}>
          <View style={{ width: isWalking ? '78%' : '100%' }}>
            {!isWalking ? (
              <TouchableOpacity style={styles.startButton} onPress={startWalkTransition} activeOpacity={0.8}><Text style={styles.startButtonText}>산책 시작하기</Text></TouchableOpacity>
            ) : (
              <View style={[styles.walkingStatusBadge, { width: '100%' }]}><Text style={{ fontSize: 15, fontWeight: '600', color: '#30D158' }}>⏱️ 기록 중</Text></View>
            )}
          </View>
          {isWalking && (
            <Animated.View style={{ backgroundColor: cardBgColor, width: 75, height: 52, borderRadius: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', marginLeft: 10 }}>
              <TouchableOpacity style={styles.stopButton} onPress={handleStopWalking} activeOpacity={0.8}><Text style={styles.stopButtonText}>종료</Text></TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

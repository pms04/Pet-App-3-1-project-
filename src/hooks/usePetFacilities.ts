import { useState, useEffect, useMemo } from 'react';

export interface PetFacility {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  time: string;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function usePetFacilities(
  currentLocation: { latitude: number; longitude: number } | null,
  radiusKm: number = 20,
) {
  const [facilities, setFacilities] = useState<PetFacility[]>([]);
  const [allData, setAllData] = useState<PetFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── 데이터 로드 (안정적인 require 방식)
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      try {
        // fetch를 사용하지 않고 require로 직접 데이터를 가져옵니다.
        // Network request failed가 발생할 수 없는 구조입니다.
        const data = require('../constants/pet_facilities.json');
        
        if (data && Array.isArray(data)) {
          setAllData(data);
          
          if (currentLocation) {
            const nearby = data.filter((f: any) => {
              const dist = getDistance(currentLocation.latitude, currentLocation.longitude, f.lat, f.lng);
              return dist <= radiusKm;
            });
            setFacilities(nearby as PetFacility[]);
          } else {
            setFacilities(data as PetFacility[]);
          }
        }
      } catch (error) {
        // 에러 메시지를 변경하여 수정본 적용 여부를 확인할 수 있게 함
        console.error('[PetFacilities] 로컬 데이터 로드 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentLocation, radiusKm]);

  // ── 검색 필터링
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return facilities;
    const query = searchQuery.toLowerCase();
    
    // 전체 데이터(allData)에서 검색 수행
    return allData.filter((f) =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query) ||
      f.address.toLowerCase().includes(query),
    );
  }, [facilities, allData, searchQuery]);

  return {
    facilities: searchResults,
    loading,
    searchQuery,
    setSearchQuery,
    nearbyCount: facilities.length,
  };
}

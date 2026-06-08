// 반려견 목록 카드 — 삭제 기능 추가
import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { styles, T } from '../../styles/styles';
import { DefaultDogAvatar } from '../../components/DefaultDogAvatar';
import { calculateDynamicAge } from '../../utils/dogAge';
import { decodeTendency } from '../../utils/dogTendency';
import type { DogRecord } from '../../hooks/useDogs';

interface Props {
  dogs: DogRecord[];
  fetching: boolean;
  onAdd: () => void;
  onEdit: (dog: DogRecord) => void;
  onDelete: (dog: DogRecord) => void;
}

function DogListInner({ dogs, fetching, onAdd, onEdit, onDelete }: Props) {
  return (
    <View style={styles.appleCardSection}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.appleSectionTitle, { marginBottom: 0 }]}>우리 집 반려견</Text>
        <TouchableOpacity style={styles.jobsAddInlineButton} onPress={onAdd}>
          <Text style={styles.jobsAddInlineButtonText}>+ 등록</Text>
        </TouchableOpacity>
      </View>

      {fetching ? (
        <ActivityIndicator size="small" color="#000" style={{ marginVertical: 20 }} />
      ) : dogs.length === 0 ? (
        <View style={styles.appleEmptyBox}>
          <Text style={styles.appleEmptyText}>
            아직 등록된 반려견이 없습니다.{'\n'}오른쪽 위 '+ 등록' 버튼으로 추가해 주세요.
          </Text>
        </View>
      ) : (
        dogs.map((item) => {
          const { avatarUri: dogImgUrl, cleanTendency } = decodeTendency(item.tendency);
          return (
            <View key={item.id} style={styles.appleDogCard}>
              <View style={styles.appleDogCardLeft}>
                <View style={styles.dogAvatarSmall}>
                  {dogImgUrl
                    ? <Image source={{ uri: dogImgUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    : <DefaultDogAvatar size={48} />
                  }
                </View>
                <View style={styles.appleDogInfoWrapper}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.appleDogName}>{item.name}</Text>
                    <View style={styles.appleGenderTag}>
                      <Text style={styles.appleGenderTagText}>{item.gender}</Text>
                    </View>
                  </View>
                  <Text style={styles.appleDogMetaData}>{item.breed} · {item.weight}kg</Text>
                  <Text style={styles.appleDogTendency}>"{cleanTendency}"</Text>
                </View>
              </View>

              {/* 오른쪽: 나이 + 수정/삭제 버튼 */}
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.appleAgeBadge}>
                  <Text style={styles.appleAgeBadgeText}>{calculateDynamicAge(item.birth_date)}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  <TouchableOpacity
                    style={[styles.jobsAddInlineButton, { paddingHorizontal: 10, paddingVertical: 5 }]}
                    onPress={() => onEdit(item)}
                  >
                    <Text style={{ color: T.blue, fontSize: 11, fontWeight: '700' }}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.jobsAddInlineButton, { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFF5F5' }]}
                    onPress={() => onDelete(item)}
                  >
                    <Text style={{ color: T.red, fontSize: 11, fontWeight: '700' }}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

export const DogList = React.memo(DogListInner);

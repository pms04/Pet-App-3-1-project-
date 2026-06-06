import { StyleSheet, Platform, Dimensions } from 'react-native';

export const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  placeholderTabText: { fontSize: 15, color: '#8E8E93', fontWeight: '600' },

  authContainer: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  authTitle: { fontSize: 36, fontWeight: '800', color: '#FF8C00', marginBottom: 6, letterSpacing: -1 },
  authSubTitle: { fontSize: 14, fontWeight: '500', color: '#8E8E93', marginBottom: 40 },
  authInput: { width: '100%', height: 52, backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#000000', marginBottom: 14, fontWeight: '500' },
  authButton: { width: '100%', height: 54, backgroundColor: '#FF8C00', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  authButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  poiMarkerContainer: { backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, elevation: 4 },
  poiMarkerIcon: { fontSize: 18 },
  matchMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  matchMarkerText: { backgroundColor: 'rgba(255,255,255,0.9)', color: '#000', fontSize: 10, fontWeight: '700', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 10, overflow: 'hidden', zIndex: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },
  matchMarkerChoco: { backgroundColor: '#0A84FF', width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, elevation: 4, marginTop: -10, zIndex: 1 },

  searchBarFloatingContainer: { position: 'absolute', left: 15, right: 15, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, zIndex: 11 },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 50 },
  vectorSearchIconWrapper: { width: 20, height: 20, marginRight: 10, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  vectorSearchCircle: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#000', position: 'absolute', top: 2, left: 2 },
  vectorSearchLine: { width: 2, height: 7, backgroundColor: '#000', position: 'absolute', bottom: 2, right: 3, transform: [{ rotate: '-45deg' }], marginRight: 0 },
  searchInput: { flex: 1, fontSize: 15, color: '#000000', fontWeight: '500', paddingVertical: 0 },

  dashboardCard: { position: 'absolute', left: 15, right: 15, borderRadius: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, zIndex: 10 },
  dashboardRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 },
  dashboardItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dashboardValue: { fontWeight: '700', fontSize: 26, letterSpacing: -0.5 },
  dashboardLabel: { fontSize: 11, fontWeight: '600', letterSpacing: -0.1 },
  paceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  paceDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5, shadowRadius: 2, shadowOpacity: 0.5, elevation: 2, shadowColor: Platform.OS === 'ios' ? '#fff' : '#000' },

  myLocationFloatingContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 190 : 140, right: 15, width: 48, height: 48, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, zIndex: 10 },
  myLocationButton_apple: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  arrowIcon_apple: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '45deg' }], marginRight: 2, marginTop: -2 },

  // ── 요구사항 5: 날씨 위젯 스타일 ──
  weatherWidgetContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 250 : 200, right: 15, width: 48, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4, zIndex: 10 },
  weatherIcon: { fontSize: 20, marginBottom: 2 },
  weatherTemp: { fontSize: 11, fontWeight: '700', color: '#1C1C1E', textAlign: 'center' },
  weatherDesc: { fontSize: 9, color: '#8E8E93', fontWeight: '600', textAlign: 'center' },

  floatingButtonPanel: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 90, left: 15, right: 15, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', height: 65, zIndex: 10 },
  actionControlsWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  walkingStatusBadge: { backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  startButton: { backgroundColor: '#FF8C00', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  stopButton: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  stopButtonText: { color: '#FF453A', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  appleContainer: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 30 },

  instaProfileHeaderCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginTop: 15, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
  instaHeaderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  instaStatsContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-around', marginLeft: 20 },
  instaStatItem: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10 },
  instaStatNumber: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5 },
  instaStatLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  instaProfileBioWrapper: { marginTop: 16, paddingHorizontal: 4 },

  avatarWrapper: { position: 'relative' },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImageReal: { width: '100%', height: '100%', borderRadius: 42 },
  avatarIconText: { fontSize: 34 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  avatarEditBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginTop: -2 },
  userHeadline: { fontSize: 21, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5 },
  userSubline: { fontSize: 13, color: '#636366', fontWeight: '500', marginTop: 4 },

  appleSecondaryButton: { marginTop: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center' },
  appleSecondaryButtonText: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },

  appleCardSection: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  appleSectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 16, letterSpacing: -0.3 },
  appleEmptyBox: { paddingVertical: 30, alignItems: 'center' },
  appleEmptyText: { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },

  jobsAddInlineButton: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  jobsAddInlineButtonText: { color: '#007AFF', fontSize: 13, fontWeight: '700' },

  appleDogCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  appleDogCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dogAvatarSmall: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  appleDogInfoWrapper: { flex: 1 },
  appleDogName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  appleGenderTag: { marginLeft: 6, backgroundColor: '#E5E5EA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  appleGenderTagText: { fontSize: 10, fontWeight: '700', color: '#48484A' },
  appleDogMetaData: { fontSize: 13, color: '#8E8E93', marginTop: 3, fontWeight: '500' },
  appleDogTendency: { fontSize: 12, color: '#636366', marginTop: 4, fontStyle: 'italic' },

  appleAgeBadge: { backgroundColor: '#F2F2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  appleAgeBadgeText: { fontSize: 12, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },

  listItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  listAvatarPlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listItemTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  listItemSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  listActionButton: { backgroundColor: '#F2F2F7', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  listActionButtonText: { fontSize: 12, fontWeight: '700', color: '#007AFF' },

  galleryGridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  polaroidFrameSquare: { width: (width - 84) / 2, backgroundColor: '#FFFFFF', borderRadius: 4, padding: 10, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#EAEAEA' },
  polaroidFrameSquareSelected: { borderColor: '#FF3B30', borderWidth: 2, backgroundColor: '#FFF5F5' },
  polaroidImageWrapper: { width: '100%', aspectRatio: 1, backgroundColor: '#F2F2F7', borderRadius: 2, overflow: 'hidden', position: 'relative' },
  galleryImage: { width: '100%', height: '100%' },
  polaroidBottomArea: { marginTop: 10, alignItems: 'center', paddingHorizontal: 2 },
  polaroidMemoSnippet: { fontSize: 12, fontWeight: '600', color: '#48484A', textAlign: 'center' },
  polaroidDateText: { fontSize: 10, color: '#A9A9A9', marginTop: 4, fontWeight: '400', letterSpacing: 0.2 },

  photoCheckboxCircle: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1.5, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  photoCheckboxCircleChecked: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
  deleteActionBarButton: { backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  deleteActionBarButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  galleryPickerCardTrigger: { width: '100%', height: 180, backgroundColor: '#F2F2F7', borderRadius: 14, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#B0B0B7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginTop: 4 },
  galleryPickerCenterContainer: { alignItems: 'center', paddingHorizontal: 20 },
  galleryPickerTriggerText: { fontSize: 13, color: '#636366', fontWeight: '600', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  galleryPreviewImageReal: { width: '100%', height: '100%', borderRadius: 14 },

  albumDetailOverlayContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  albumDetailCentralCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  detailCardPolaroidTopFrame: { width: '100%', aspectRatio: 1.05, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden' },
  albumDetailImageReal: { width: '100%', height: '100%' },
  detailCardTextContainer: { marginTop: 16 },
  detailCardDateHeader: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 12 },
  albumDetailEditableMemoInput: { width: '100%', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 12, fontSize: 14, color: '#1C1C1E', fontWeight: '500', minHeight: 75, textAlignVertical: 'top', marginBottom: 16 },
  detailActionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailActionBtn: { flex: 1, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },

  modalHeaderContainer: { height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', backgroundColor: '#FFF' },

  inputGroup: { marginBottom: 14 },
  appleLabel: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', marginBottom: 6, paddingLeft: 2 },
  appleInput: { width: '100%', height: 44, backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 14, fontSize: 14, color: '#000', fontWeight: '500' },
  appleSelector: { width: '100%', height: 44, backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appleSelectorText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },

  addressSearchBoxContainer: { backgroundColor: '#F2F2F7', borderRadius: 12, marginTop: 6, padding: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  addressSearchInputInside: { height: 40, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: '#000', marginBottom: 8, fontWeight: '600' },
  addressSearchItemRow: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  addressSearchItemText: { fontSize: 13, color: '#1C1C1E', fontWeight: '500' },
  addressSearchNoResult: { paddingVertical: 14, fontSize: 12, color: '#8E8E93', textAlign: 'center' },

  dogAvatarUploadTrigger: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'visible', borderWidth: 1, borderColor: '#E5E5EA' },
  avatarEditBadgeSmallAbsolute: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },

  appleGenderSegmentRow: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 2, justifyContent: 'space-between' },
  appleSegmentButton: { flex: 1, paddingVertical: 8, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  appleSegmentButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  appleSegmentButtonText: { fontSize: 11, fontWeight: '600', color: '#636366' },
  appleSegmentButtonTextActive: { color: '#1C1C1E', fontWeight: '700' },
});

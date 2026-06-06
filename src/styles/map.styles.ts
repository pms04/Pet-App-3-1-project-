// 스타일 네임스페이스 분할
// 원본 styles.ts(전체 StyleSheet)는 유지하여 기존 import는 100% 호환.
// 신규 컴포넌트는 본인 영역 파일만 import 하여 응집도를 높입니다.
import { styles as all } from './styles';

// Map 영역 (지도/검색/대시보드/액션)
export const mapStyles = {
  container: all.container,
  map: all.map,
  poiMarkerContainer: all.poiMarkerContainer,
  poiMarkerIcon: all.poiMarkerIcon,
  matchMarkerContainer: all.matchMarkerContainer,
  matchMarkerText: all.matchMarkerText,
  matchMarkerChoco: all.matchMarkerChoco,
  searchBarFloatingContainer: all.searchBarFloatingContainer,
  searchBarWrapper: all.searchBarWrapper,
  vectorSearchIconWrapper: all.vectorSearchIconWrapper,
  vectorSearchCircle: all.vectorSearchCircle,
  vectorSearchLine: all.vectorSearchLine,
  searchInput: all.searchInput,
  dashboardCard: all.dashboardCard,
  dashboardRow: all.dashboardRow,
  dashboardItem: all.dashboardItem,
  dashboardValue: all.dashboardValue,
  dashboardLabel: all.dashboardLabel,
  paceContainer: all.paceContainer,
  paceDot: all.paceDot,
  myLocationFloatingContainer: all.myLocationFloatingContainer,
  myLocationButton_apple: all.myLocationButton_apple,
  arrowIcon_apple: all.arrowIcon_apple,
  weatherWidgetContainer: all.weatherWidgetContainer,
  weatherIcon: all.weatherIcon,
  weatherTemp: all.weatherTemp,
  weatherDesc: all.weatherDesc,
  floatingButtonPanel: all.floatingButtonPanel,
  actionControlsWrapper: all.actionControlsWrapper,
  walkingStatusBadge: all.walkingStatusBadge,
  startButton: all.startButton,
  startButtonText: all.startButtonText,
  stopButton: all.stopButton,
  stopButtonText: all.stopButtonText,
};

export interface UiState {
  isBottomNavVisible: boolean;
}

const uiState: UiState = {
  isBottomNavVisible: true,
};

export function getUiState(): UiState {
  return uiState;
}


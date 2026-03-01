export type PanelState = 'expanded' | 'minimized';

export const PANEL_ANIMATION_DURATION_MS = 280;
export const PANEL_COLLAPSE_VELOCITY = 150;

export function getPanelSnapState(
  currentY: number,
  maxPanelDrag: number,
  velocityY: number
): PanelState {
  const threshold = maxPanelDrag * 0.5;
  const shouldCollapse = currentY > threshold || velocityY > PANEL_COLLAPSE_VELOCITY;
  return shouldCollapse ? 'minimized' : 'expanded';
}

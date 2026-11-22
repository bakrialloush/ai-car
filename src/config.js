export const CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 600,
  TRACK: {
    WIDTH: 90,
    MIN_POINT_DISTANCE: 25,
    ROAD_COLOR: "#3d405b",
    BORDER_COLOR: "#ffffff",
    CENTER_LINE_COLOR: "#f4a261",
  },
  CAR: {
    LENGTH: 32,
    WIDTH: 16,
    ACCELERATION: 0.08,
    MAX_SPEED: 2.2,
    FRICTION: 0.03,
    TURN_SPEED: 0.035,
    COLOR: "#3b82f6",
    DAMAGED_COLOR: "#ef4444",
  },
  SENSOR: {
    RAY_COUNT: 5,
    RAY_LENGTH: 150,
    RAY_SPREAD: Math.PI * 0.75, // زاوية انتشار الأشعة (135 درجة)
    RAY_COLOR: "#facc15",
    HIT_COLOR: "#111827",
  },
  AI: {
    HIDDEN_NEURONS: 6,
    OUTPUT_NEURONS: 2, // [left, right]
  },
};
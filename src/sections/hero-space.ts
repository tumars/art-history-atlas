import type { Work } from "../types";

export interface SkyWork {
  work: Work;
  x: number;
  y: number;
  depth: number;
  size: number;
  angle: number;
}

export interface SkyCamera { x: number; y: number; distance: number }
export interface SkyViewport { width: number; height: number }
export interface SkyLoop { width: number; height: number }

export const DEFAULT_DISTANCE = 550;
export const MIN_DISTANCE = 180;
export const MAX_DISTANCE = 1400;

// 固定散布，重新打开时仍能找到同一幅画；年代沿折返的行连续排列。
const noise = (i: number, salt: number) => {
  const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export function skyLoop(count: number): SkyLoop & { rows: number } {
  const columns = Math.min(24, Math.ceil(Math.sqrt(count * 1.5)));
  const rows = columns ? Math.ceil(count / columns) : 0;
  return { width: columns * 360, height: rows * 300, rows };
}

/** 与镜头最近的一圈；换圈只发生在远离视口的位置。 */
export const wrapOffset = (value: number, span: number) => ((value + span / 2) % span + span) % span - span / 2;

export function loopWork(item: SkyWork, camera: SkyCamera, loop: SkyLoop): SkyWork {
  return {
    ...item,
    x: camera.x + wrapOffset(item.x - camera.x, loop.width),
    y: camera.y + wrapOffset(item.y - camera.y, loop.height),
  };
}

export function arrangeWorks(works: Work[]): SkyWork[] {
  const { width, rows } = skyLoop(works.length);
  return works.map((work, i) => {
    // 每行均匀分配，避免最后一行缺半排，在接缝处留下空洞。
    const row = Math.floor(i * rows / works.length);
    const start = Math.ceil(row * works.length / rows);
    const count = Math.ceil((row + 1) * works.length / rows) - start;
    const col = row % 2 ? count - 1 - (i - start) : i - start;
    return {
      work,
      x: ((col + .5) / count - .5) * width + (noise(i, 1) - .5) * 115,
      y: (row - (rows - 1) / 2) * 300 + (noise(i, 2) - .5) * 95,
      depth: [380, 720, 1120][i % 3] + noise(i, 3) * 90,
      size: 215 + noise(i, 4) * 65,
      angle: (noise(i, 5) - .5) * 12,
    };
  });
}

export const focalLength = (view: SkyViewport) => Math.max(550, Math.min(1000, view.width * .9));

export function projectWork(item: SkyWork, camera: SkyCamera, view: SkyViewport, loop?: SkyLoop) {
  if (loop) item = loopWork(item, camera, loop);
  const perspective = focalLength(view) / (item.depth + camera.distance);
  const x = view.width / 2 + (item.x - camera.x) * perspective;
  const y = view.height / 2 + (item.y - camera.y) * perspective;
  const centrality = 1 - Math.min(1, Math.hypot((x - view.width / 2) / view.width, (y - view.height / 2) / view.height));
  const scale = perspective * (.9 + centrality * .1);
  return {
    x, y, scale,
    light: Math.min(1.12, .53 + perspective * .48),
    opacity: Math.min(1, .55 + perspective * .45),
  };
}

export function focusCamera(item: SkyWork, distance: number, view: SkyViewport, loop?: SkyLoop, from?: SkyCamera): SkyCamera {
  const perspective = focalLength(view) / (item.depth + distance);
  const x = item.x - view.width * .18 / perspective;
  const y = item.y - view.height * .04 / perspective;
  return {
    x: loop && from ? from.x + wrapOffset(x - from.x, loop.width) : x,
    y: loop && from ? from.y + wrapOffset(y - from.y, loop.height) : y,
    distance,
  };
}

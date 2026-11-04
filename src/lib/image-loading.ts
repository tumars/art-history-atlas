/** 小图先显示，大图下载并解码后替换；切换作品时取消旧图的回调。 */
const cancel = new WeakMap<HTMLImageElement, () => void>();

export function clearProgressiveImage(img: HTMLImageElement) {
  cancel.get(img)?.();
  cancel.delete(img);
  img.onload = img.onerror = null;
  img.removeAttribute('src');
  delete img.dataset.quality;
}

export function loadProgressiveImage(img: HTMLImageElement, preview: string, full: string) {
  clearProgressiveImage(img);
  let stopped = false, started = false;
  const large = new Image();
  large.decoding = 'async';
  cancel.set(img, () => {
    stopped = true;
    large.onload = large.onerror = null;
    large.removeAttribute('src');
  });
  const upgrade = () => {
    if (stopped || started || preview === full) return;
    started = true;
    large.onload = async () => {
      try { await large.decode(); } catch { return; }
      if (stopped || !img.isConnected) return;
      img.onload = img.onerror = null;
      img.src = full;
      img.width = large.naturalWidth;
      img.height = large.naturalHeight;
      img.dataset.quality = 'full';
    };
    // 下载失败时保留已经可见的小图。
    large.onerror = () => { img.dataset.quality = 'preview'; };
    large.src = full;
  };
  img.onload = upgrade;
  img.onerror = upgrade;
  img.decoding = 'async';
  img.dataset.quality = 'preview';
  img.src = preview;
  if (img.complete && img.naturalWidth) upgrade();
}

const pending = new Set<Element>();
const observer = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    observer.unobserve(target);
    pending.delete(target);
    if (target instanceof HTMLImageElement) {
      loadProgressiveImage(target, target.dataset.preview!, target.dataset.full!);
      delete target.dataset.preview;
      delete target.dataset.full;
    } else {
      target.setAttribute('href', target.getAttribute('data-image-src')!);
      target.removeAttribute('data-image-src');
    }
  }
}, { rootMargin: '160px' });

/** 同时处理 HTML 大图和不支持原生 lazy 的 SVG 缩略图。 */
export function observeImages(root: ParentNode) {
  for (const el of pending) {
    if (!el.isConnected) { observer.unobserve(el); pending.delete(el); }
  }
  for (const el of root.querySelectorAll('img[data-preview], image[data-image-src]')) {
    pending.add(el);
    observer.observe(el);
  }
}

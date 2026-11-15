import { useEffect, useState } from 'preact/hooks';

export type Toast = { id: number; text: string; link?: { href: string; label: string } };

let current: Toast | null = null;
let timer: number | undefined;
const subs = new Set<(t: Toast | null) => void>();

export function toast(text: string, link?: Toast['link'], ms = 3200) {
  current = { id: Date.now(), text, link };
  subs.forEach((f) => f(current));
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    current = null;
    subs.forEach((f) => f(null));
  }, ms);
}

export function useToast(): Toast | null {
  const [t, setT] = useState<Toast | null>(current);
  useEffect(() => {
    subs.add(setT);
    return () => void subs.delete(setT);
  }, []);
  return t;
}

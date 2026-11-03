import { Alert, Platform } from 'react-native';

/**
 * Imperative feedback channel shared by every screen.
 *
 * `react-native-web` ships `Alert` as a no-op, so anything routed through it is invisible in
 * the browser (the web build is a first-class target here). On web these messages land in an
 * in-app store consumed by `ToastHost`; on native the call is forwarded to `Alert.alert`
 * untouched, so behaviour there stays exactly as it was.
 */

export interface FeedbackMessage {
  id: number;
  title: string;
  message?: string;
}

type FeedbackListener = (message: FeedbackMessage | null) => void;

let currentMessage: FeedbackMessage | null = null;
let nextId = 1;
const listeners = new Set<FeedbackListener>();

function notify(): void {
  for (const listener of listeners) listener(currentMessage);
}

/** Surfaces a message: a toast on web, the native alert everywhere else. */
export function showMessage(title: string, message?: string): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message);
    return;
  }

  // A newer message replaces the current one instead of queueing behind it.
  currentMessage = { id: nextId, title, message };
  nextId += 1;
  notify();
}

export function dismissMessage(): void {
  if (currentMessage === null) return;

  currentMessage = null;
  notify();
}

export function subscribeFeedback(listener: FeedbackListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns the same object reference between notifications, which is what
 * `useSyncExternalStore` requires to avoid an infinite render loop.
 */
export function getFeedbackSnapshot(): FeedbackMessage | null {
  return currentMessage;
}

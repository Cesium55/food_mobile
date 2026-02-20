export type WorkflowEventListener = (payload?: unknown) => void;
export type WorkflowAnyEventListener = (eventName: string, payload?: unknown) => void;

export class WorkflowEventBus {
  private listeners = new Map<string, Set<WorkflowEventListener>>();
  private anyListeners = new Set<WorkflowAnyEventListener>();

  on(eventName: string, listener: WorkflowEventListener): () => void {
    const eventListeners = this.listeners.get(eventName) ?? new Set<WorkflowEventListener>();
    eventListeners.add(listener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      const current = this.listeners.get(eventName);
      if (!current) {
        return;
      }
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  onAny(listener: WorkflowAnyEventListener): () => void {
    this.anyListeners.add(listener);
    return () => {
      this.anyListeners.delete(listener);
    };
  }

  emit(eventName: string, payload?: unknown): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach((listener) => listener(payload));
    }

    this.anyListeners.forEach((listener) => listener(eventName, payload));
  }
}

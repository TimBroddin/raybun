import type {
  RayRequest,
  StoredPayload,
  PayloadType,
  ColorContent,
  LabelContent,
  SizeContent,
  NewScreenContent,
} from './types';

type Listener = () => void;

const MAX_PAYLOADS = 1000;

class PayloadStore {
  private payloads: StoredPayload[] = [];
  private listeners: Set<Listener> = new Set();
  private currentScreen: string = 'default';
  private payloadCounter = 0;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getPayloads(): StoredPayload[] {
    return this.payloads.filter((p) => !p.hidden);
  }

  getAllPayloads(): StoredPayload[] {
    return this.payloads;
  }

  getPayloadsByScreen(screen: string): StoredPayload[] {
    return this.payloads.filter((p) => p.screen === screen && !p.hidden);
  }

  getCurrentScreen(): string {
    return this.currentScreen;
  }

  addRequest(request: RayRequest): void {
    const timestamp = new Date();

    for (const payload of request.payloads) {
      this.processPayload(request.uuid, payload, request.meta, timestamp);
    }

    // Trim old payloads if exceeding limit
    if (this.payloads.length > MAX_PAYLOADS) {
      this.payloads = this.payloads.slice(-MAX_PAYLOADS);
    }

    this.notify();
  }

  private processPayload(
    uuid: string,
    payload: {
      type: PayloadType;
      content: unknown;
      origin?: StoredPayload['origin'];
    },
    meta: RayRequest['meta'],
    timestamp: Date
  ): void {
    const { type, content, origin } = payload;

    // Handle special payload types that modify existing payloads
    switch (type) {
      case 'color': {
        const colorContent = content as ColorContent;
        this.applyToPayload(uuid, (p) => {
          p.color = colorContent.color;
        });
        return;
      }
      case 'label': {
        const labelContent = content as LabelContent;
        this.applyToPayload(uuid, (p) => {
          p.label = labelContent.label;
        });
        return;
      }
      case 'size': {
        const sizeContent = content as SizeContent;
        this.applyToPayload(uuid, (p) => {
          p.size = sizeContent.size;
        });
        return;
      }
      case 'new_screen': {
        const screenContent = content as NewScreenContent;
        this.currentScreen = screenContent.name;
        return;
      }
      case 'clear_all':
        this.payloads = [];
        return;
      case 'hide':
        this.applyToPayload(uuid, (p) => {
          p.hidden = true;
        });
        return;
      case 'remove':
        this.payloads = this.payloads.filter((p) => p.uuid !== uuid);
        return;
      case 'show_app':
      case 'hide_app':
      case 'confetti':
        // These are desktop app commands - we can ignore or log them
        return;
    }

    // Regular payload - add to store
    const storedPayload: StoredPayload = {
      id: `${Date.now()}-${this.payloadCounter++}`,
      uuid,
      type,
      content: content as StoredPayload['content'],
      origin,
      meta,
      timestamp,
      screen: this.currentScreen,
    };

    this.payloads.push(storedPayload);
  }

  private applyToPayload(
    uuid: string,
    modifier: (payload: StoredPayload) => void
  ): void {
    // Find the most recent payload with this UUID
    for (let i = this.payloads.length - 1; i >= 0; i--) {
      const payload = this.payloads[i];
      if (payload && payload.uuid === uuid) {
        modifier(payload);
        return;
      }
    }
  }

  clear(): void {
    this.payloads = [];
    this.notify();
  }

  getPayloadById(id: string): StoredPayload | undefined {
    return this.payloads.find((p) => p.id === id);
  }

  getScreens(): string[] {
    const screens = new Set<string>();
    for (const payload of this.payloads) {
      if (payload.screen) {
        screens.add(payload.screen);
      }
    }
    return Array.from(screens);
  }
}

// Singleton store instance
export const store = new PayloadStore();

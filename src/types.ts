// Ray protocol types

export interface RayOrigin {
  file: string;
  line_number: number;
  function_name?: string;
  class_name?: string;
  hostname?: string;
}

export interface RayMeta {
  php_version?: string;
  php_version_id?: number;
  project_name?: string;
  ray_package_version?: string;
  laravel_version?: string;
  laravel_ray_package_version?: string;
}

// Base payload content types
export interface LogContent {
  values: unknown[];
  label?: string;
}

export interface CustomContent {
  content: string;
  label: string;
}

export interface ColorContent {
  color: string;
}

export interface LabelContent {
  label: string;
}

export interface SizeContent {
  size: 'sm' | 'lg';
}

export interface TableContent {
  values: Record<string, unknown>[];
  label?: string;
}

export interface ExceptionContent {
  class: string;
  message: string;
  frames: Array<{
    file_name: string;
    line_number: number;
    class?: string;
    method?: string;
    vendor_frame: boolean;
  }>;
}

export interface TraceContent {
  frames: Array<{
    file_name: string;
    line_number: number;
    class?: string;
    method?: string;
    vendor_frame: boolean;
  }>;
}

export interface QueryContent {
  sql: string;
  bindings?: unknown[];
  time?: number;
  connection_name?: string;
  is_slow?: boolean;
  is_duplicate?: boolean;
}

export interface HtmlContent {
  content: string;
}

export interface JsonContent {
  value: unknown;
}

export interface ImageContent {
  url?: string;
  path?: string;
  location?: string;
}

export interface TextContent {
  content: string;
}

export interface SeparatorContent {}

export interface NewScreenContent {
  name: string;
}

export interface ClearAllContent {}

export interface NotifyContent {
  value: string;
}

export interface MeasureContent {
  name: string;
  total_time?: number;
  max_memory_usage_during_total_time?: number;
  is_new_timer?: boolean;
}

export interface CallerContent {
  frame: {
    file_name: string;
    line_number: number;
    class?: string;
    method?: string;
  };
}

export interface BoolContent {
  value: boolean;
}

export interface NullContent {}

export interface CarbonContent {
  formatted: string;
  timestamp: number;
  timezone: string;
}

export interface ApplicationLogContent {
  value: string;
  level?: string;
  context?: Record<string, unknown>;
}

export interface FileContentsContent {
  file: string;
  contents: string;
}

export interface XmlContent {
  value: string;
}

// Payload type union
export type PayloadType =
  | 'log'
  | 'custom'
  | 'color'
  | 'label'
  | 'size'
  | 'table'
  | 'exception'
  | 'trace'
  | 'executed_query'
  | 'slow_query'
  | 'duplicate_query'
  | 'html'
  | 'json'
  | 'image'
  | 'text'
  | 'separator'
  | 'new_screen'
  | 'clear_all'
  | 'notify'
  | 'measure'
  | 'caller'
  | 'bool'
  | 'null'
  | 'carbon'
  | 'application_log'
  | 'file_contents'
  | 'xml'
  | 'hide'
  | 'remove'
  | 'show_app'
  | 'hide_app'
  | 'confetti'
  | 'create_lock'
  | 'expand'
  | 'limit';

// Content type mapping
export type PayloadContent =
  | LogContent
  | CustomContent
  | ColorContent
  | LabelContent
  | SizeContent
  | TableContent
  | ExceptionContent
  | TraceContent
  | QueryContent
  | HtmlContent
  | JsonContent
  | ImageContent
  | TextContent
  | SeparatorContent
  | NewScreenContent
  | ClearAllContent
  | NotifyContent
  | MeasureContent
  | CallerContent
  | BoolContent
  | NullContent
  | CarbonContent
  | ApplicationLogContent
  | FileContentsContent
  | XmlContent;

export interface RayPayload {
  type: PayloadType;
  content: PayloadContent;
  origin?: RayOrigin;
}

export interface RayRequest {
  uuid: string;
  payloads: RayPayload[];
  meta?: RayMeta;
}

// Internal representation with timestamp and ID
export interface StoredPayload {
  id: string;
  uuid: string;
  type: PayloadType;
  content: PayloadContent;
  origin?: RayOrigin;
  meta?: RayMeta;
  timestamp: Date;
  color?: string;
  label?: string;
  size?: 'sm' | 'lg';
  screen?: string;
  hidden?: boolean;
}

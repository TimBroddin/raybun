import React from 'react';
import { Text, Box, Transform } from 'ink';
import { highlight } from 'cli-highlight';
import type {
  StoredPayload,
  LogContent,
  CustomContent,
  ExceptionContent,
  QueryContent,
  TableContent,
  TraceContent,
  HtmlContent,
  JsonContent,
  TextContent,
  NotifyContent,
  MeasureContent,
  CallerContent,
  BoolContent,
  CarbonContent,
  ApplicationLogContent,
  FileContentsContent,
  XmlContent,
  ImageContent,
} from '../../types';

// Syntax highlight code with a given language
function highlightCode(code: string, language: string): string {
  try {
    return highlight(code, { language, ignoreIllegals: true });
  } catch {
    return code;
  }
}

// Component to render highlighted code
function HighlightedCode({ code, language }: { code: string; language: string }) {
  const highlighted = highlightCode(code, language);
  return (
    <Transform transform={(output) => output}>
      <Text>{highlighted}</Text>
    </Transform>
  );
}

// Helper to stringify values for display
function stringify(value: unknown, indent = 2): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return String(value);
  }
}

// Detect what language a string might be
function detectLanguage(str: string): string | null {
  const trimmed = str.trim();

  // HTML/XML detection
  if (trimmed.startsWith('<') && (trimmed.includes('</') || trimmed.includes('/>'))) {
    if (trimmed.toLowerCase().includes('<script') || trimmed.toLowerCase().includes('</script>')) {
      return 'html'; // HTML with embedded JS
    }
    if (trimmed.startsWith('<?xml') || /<[a-z]+[^>]*xmlns/i.test(trimmed)) {
      return 'xml';
    }
    return 'html';
  }

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // SQL detection
  const sqlKeywords = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|WITH)\s/i;
  if (sqlKeywords.test(trimmed)) {
    return 'sql';
  }

  // PHP detection
  if (trimmed.startsWith('<?php') || trimmed.startsWith('<?=')) {
    return 'php';
  }

  // JavaScript detection (function declarations, arrow functions, common patterns)
  if (/^(function\s|const\s|let\s|var\s|class\s|async\s|export\s|import\s|\([^)]*\)\s*=>|[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*function)/.test(trimmed)) {
    return 'javascript';
  }

  // CSS detection
  if (/^[.#@][a-zA-Z].*\{/.test(trimmed) || /^[a-z-]+\s*:\s*[^;]+;/i.test(trimmed)) {
    return 'css';
  }

  return null;
}

// Stringify and highlight based on content
function stringifyHighlighted(value: unknown, indent = 2): React.ReactNode {
  // Handle objects/arrays as JSON
  if (typeof value === 'object' && value !== null) {
    const json = stringify(value, indent);
    return <HighlightedCode code={json} language="json" />;
  }

  // Handle strings - try to detect language
  if (typeof value === 'string') {
    const detectedLang = detectLanguage(value);
    if (detectedLang) {
      return <HighlightedCode code={value} language={detectedLang} />;
    }
    return <Text>{value}</Text>;
  }

  // Other primitives
  return <Text>{stringify(value, indent)}</Text>;
}

// Truncate text for preview
export function truncate(text: string, maxLength: number = 50): string {
  const singleLine = text.replace(/\n/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return singleLine.slice(0, maxLength - 3) + '...';
}

// Get preview text for payload list
export function getPreviewText(payload: StoredPayload): string {
  const { type, content } = payload;

  switch (type) {
    case 'log': {
      const logContent = content as LogContent;
      const values = logContent.values.map((v) => stringify(v, 0)).join(', ');
      return truncate(values);
    }
    case 'custom': {
      const customContent = content as CustomContent;
      return truncate(customContent.content);
    }
    case 'exception': {
      const exceptionContent = content as ExceptionContent;
      return truncate(`${exceptionContent.class}: ${exceptionContent.message}`);
    }
    case 'executed_query':
    case 'slow_query':
    case 'duplicate_query': {
      const queryContent = content as QueryContent;
      return truncate(queryContent.sql);
    }
    case 'table': {
      const tableContent = content as TableContent;
      return `${tableContent.values.length} rows`;
    }
    case 'trace': {
      const traceContent = content as TraceContent;
      return `${traceContent.frames.length} frames`;
    }
    case 'notify': {
      const notifyContent = content as NotifyContent;
      return truncate(notifyContent.value);
    }
    case 'measure': {
      const measureContent = content as MeasureContent;
      if (measureContent.total_time !== undefined) {
        return `${measureContent.name}: ${measureContent.total_time}ms`;
      }
      return measureContent.name;
    }
    case 'bool': {
      const boolContent = content as BoolContent;
      return String(boolContent.value);
    }
    case 'null':
      return 'null';
    case 'carbon': {
      const carbonContent = content as CarbonContent;
      return carbonContent.formatted;
    }
    case 'application_log': {
      const appLogContent = content as ApplicationLogContent;
      return truncate(appLogContent.value);
    }
    case 'text':
    case 'html':
    case 'xml': {
      const textContent = content as TextContent | HtmlContent | XmlContent;
      return truncate(
        'content' in textContent ? textContent.content : (textContent as XmlContent).value
      );
    }
    case 'json': {
      const jsonContent = content as JsonContent;
      return truncate(stringify(jsonContent.value, 0));
    }
    case 'image': {
      const imageContent = content as ImageContent;
      return truncate(imageContent.url || imageContent.path || 'Image');
    }
    case 'caller': {
      const callerContent = content as CallerContent;
      return `${callerContent.frame.file_name}:${callerContent.frame.line_number}`;
    }
    case 'file_contents': {
      const fileContent = content as FileContentsContent;
      return truncate(fileContent.file);
    }
    case 'separator':
      return '────────';
    default:
      return type;
  }
}

// Get color for payload type - using brighter, more readable colors
export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    log: 'greenBright',
    custom: 'cyanBright',
    exception: 'redBright',
    executed_query: 'blueBright',
    slow_query: 'yellowBright',
    duplicate_query: 'magentaBright',
    table: 'cyanBright',
    trace: 'white',
    notify: 'yellowBright',
    measure: 'blueBright',
    bool: 'greenBright',
    null: 'white',
    carbon: 'cyanBright',
    application_log: 'greenBright',
    text: 'whiteBright',
    html: 'magentaBright',
    xml: 'magentaBright',
    json: 'cyanBright',
    image: 'yellowBright',
    caller: 'white',
    file_contents: 'blueBright',
    separator: 'white',
  };
  return colors[type] || 'whiteBright';
}

// Full detail renderer
export function renderDetail(payload: StoredPayload): React.ReactNode {
  const { type, content } = payload;

  switch (type) {
    case 'log':
      return <LogRenderer content={content as LogContent} />;
    case 'custom':
      return <CustomRenderer content={content as CustomContent} />;
    case 'exception':
      return <ExceptionRenderer content={content as ExceptionContent} />;
    case 'executed_query':
    case 'slow_query':
    case 'duplicate_query':
      return <QueryRenderer content={content as QueryContent} type={type} />;
    case 'table':
      return <TableRenderer content={content as TableContent} />;
    case 'trace':
      return <TraceRenderer content={content as TraceContent} />;
    case 'notify':
      return <NotifyRenderer content={content as NotifyContent} />;
    case 'measure':
      return <MeasureRenderer content={content as MeasureContent} />;
    case 'bool':
      return <BoolRenderer content={content as BoolContent} />;
    case 'null':
      return <NullRenderer />;
    case 'carbon':
      return <CarbonRenderer content={content as CarbonContent} />;
    case 'application_log':
      return <ApplicationLogRenderer content={content as ApplicationLogContent} />;
    case 'text':
      return <TextRenderer content={content as TextContent} />;
    case 'html':
      return <HtmlRenderer content={content as HtmlContent} />;
    case 'xml':
      return <XmlRenderer content={content as XmlContent} />;
    case 'json':
      return <JsonRenderer content={content as JsonContent} />;
    case 'image':
      return <ImageRenderer content={content as ImageContent} />;
    case 'caller':
      return <CallerRenderer content={content as CallerContent} />;
    case 'file_contents':
      return <FileContentsRenderer content={content as FileContentsContent} />;
    case 'separator':
      return <SeparatorRenderer />;
    default:
      return <GenericRenderer content={content} type={type} />;
  }
}

// Individual renderers
function LogRenderer({ content }: { content: LogContent }) {
  return (
    <Box flexDirection="column">
      {content.label && (
        <Text color="cyanBright" bold>
          {content.label}
        </Text>
      )}
      {content.values.map((value, i) => (
        <Box key={i} flexDirection="column">
          {stringifyHighlighted(value)}
        </Box>
      ))}
    </Box>
  );
}

function CustomRenderer({ content }: { content: CustomContent }) {
  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {content.label}
      </Text>
      <Text>{content.content}</Text>
    </Box>
  );
}

function ExceptionRenderer({ content }: { content: ExceptionContent }) {
  return (
    <Box flexDirection="column">
      <Text color="red" bold>
        {content.class}
      </Text>
      <Text color="red">{content.message}</Text>
      <Text> </Text>
      <Text color="gray" bold>
        Stack Trace:
      </Text>
      {content.frames.slice(0, 10).map((frame, i) => (
        <Text
          key={i}
          color={frame.vendor_frame ? 'gray' : 'white'}
          dimColor={frame.vendor_frame}
        >
          {`  ${frame.file_name}:${frame.line_number}`}
          {frame.method && ` in ${frame.class ? `${frame.class}::` : ''}${frame.method}`}
        </Text>
      ))}
      {content.frames.length > 10 && (
        <Text color="gray">  ... {content.frames.length - 10} more frames</Text>
      )}
    </Box>
  );
}

function QueryRenderer({
  content,
  type,
}: {
  content: QueryContent;
  type: string;
}) {
  const isSlow = type === 'slow_query' || content.is_slow;
  const isDuplicate = type === 'duplicate_query' || content.is_duplicate;

  return (
    <Box flexDirection="column">
      {isSlow && (
        <Text color="yellowBright" bold>
          ⚠ SLOW QUERY
        </Text>
      )}
      {isDuplicate && (
        <Text color="magentaBright" bold>
          ⚠ DUPLICATE QUERY
        </Text>
      )}
      <HighlightedCode code={content.sql} language="sql" />
      {content.bindings && content.bindings.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="white">Bindings:</Text>
          {stringifyHighlighted(content.bindings)}
        </Box>
      )}
      {content.time !== undefined && (
        <Text color={isSlow ? 'yellowBright' : 'white'}>Time: {content.time}ms</Text>
      )}
      {content.connection_name && (
        <Text color="white">Connection: {content.connection_name}</Text>
      )}
    </Box>
  );
}

function TableRenderer({ content }: { content: TableContent }) {
  if (!content.values.length) {
    return <Text color="gray">Empty table</Text>;
  }

  const firstRow = content.values[0];
  if (!firstRow) {
    return <Text color="gray">Empty table</Text>;
  }

  const keys = Object.keys(firstRow);
  const colWidths = keys.map((k) =>
    Math.max(
      k.length,
      ...content.values.map((row) => String(row[k] ?? '').length)
    )
  );

  const header = keys.map((k, i) => k.padEnd(colWidths[i] ?? 0)).join(' | ');
  const separator = colWidths.map((w) => '-'.repeat(w)).join('-+-');

  return (
    <Box flexDirection="column">
      {content.label && (
        <Text color="cyan" bold>
          {content.label}
        </Text>
      )}
      <Text color="cyan" bold>
        {header}
      </Text>
      <Text color="gray">{separator}</Text>
      {content.values.slice(0, 20).map((row, i) => (
        <Text key={i}>
          {keys.map((k, j) => String(row[k] ?? '').padEnd(colWidths[j] ?? 0)).join(' | ')}
        </Text>
      ))}
      {content.values.length > 20 && (
        <Text color="gray">... {content.values.length - 20} more rows</Text>
      )}
    </Box>
  );
}

function TraceRenderer({ content }: { content: TraceContent }) {
  return (
    <Box flexDirection="column">
      <Text color="gray" bold>
        Stack Trace:
      </Text>
      {content.frames.slice(0, 15).map((frame, i) => (
        <Text
          key={i}
          color={frame.vendor_frame ? 'gray' : 'white'}
          dimColor={frame.vendor_frame}
        >
          {`  ${frame.file_name}:${frame.line_number}`}
          {frame.method && ` in ${frame.class ? `${frame.class}::` : ''}${frame.method}`}
        </Text>
      ))}
      {content.frames.length > 15 && (
        <Text color="gray">  ... {content.frames.length - 15} more frames</Text>
      )}
    </Box>
  );
}

function NotifyRenderer({ content }: { content: NotifyContent }) {
  return (
    <Box borderStyle="round" borderColor="yellow" paddingX={1}>
      <Text color="yellow">{content.value}</Text>
    </Box>
  );
}

function MeasureRenderer({ content }: { content: MeasureContent }) {
  return (
    <Box flexDirection="column">
      <Text color="blue" bold>
        {content.name}
      </Text>
      {content.total_time !== undefined && (
        <Text>Time: {content.total_time}ms</Text>
      )}
      {content.max_memory_usage_during_total_time !== undefined && (
        <Text>
          Memory: {(content.max_memory_usage_during_total_time / 1024 / 1024).toFixed(2)}MB
        </Text>
      )}
    </Box>
  );
}

function BoolRenderer({ content }: { content: BoolContent }) {
  return (
    <Text color={content.value ? 'green' : 'red'} bold>
      {String(content.value)}
    </Text>
  );
}

function NullRenderer() {
  return (
    <Text color="gray" italic>
      null
    </Text>
  );
}

function CarbonRenderer({ content }: { content: CarbonContent }) {
  return (
    <Box flexDirection="column">
      <Text color="cyan">{content.formatted}</Text>
      <Text color="gray">Timezone: {content.timezone}</Text>
    </Box>
  );
}

function ApplicationLogRenderer({ content }: { content: ApplicationLogContent }) {
  const levelColors: Record<string, string> = {
    emergency: 'redBright',
    alert: 'redBright',
    critical: 'redBright',
    error: 'redBright',
    warning: 'yellowBright',
    notice: 'cyanBright',
    info: 'greenBright',
    debug: 'white',
  };

  return (
    <Box flexDirection="column">
      {content.level && (
        <Text color={levelColors[content.level] || 'white'} bold>
          [{content.level.toUpperCase()}]
        </Text>
      )}
      <Text>{content.value}</Text>
      {content.context && Object.keys(content.context).length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="white">Context:</Text>
          {stringifyHighlighted(content.context)}
        </Box>
      )}
    </Box>
  );
}

function TextRenderer({ content }: { content: TextContent }) {
  return <Text>{content.content}</Text>;
}

function HtmlRenderer({ content }: { content: HtmlContent }) {
  return (
    <Box flexDirection="column">
      <Text color="white" italic>
        (HTML)
      </Text>
      <HighlightedCode code={content.content} language="html" />
    </Box>
  );
}

function XmlRenderer({ content }: { content: XmlContent }) {
  return (
    <Box flexDirection="column">
      <Text color="white" italic>
        (XML)
      </Text>
      <HighlightedCode code={content.value} language="xml" />
    </Box>
  );
}

function JsonRenderer({ content }: { content: JsonContent }) {
  return <Box flexDirection="column">{stringifyHighlighted(content.value)}</Box>;
}

function ImageRenderer({ content }: { content: ImageContent }) {
  return (
    <Box flexDirection="column">
      <Text color="yellow" bold>
        Image
      </Text>
      {content.url && <Text>URL: {content.url}</Text>}
      {content.path && <Text>Path: {content.path}</Text>}
    </Box>
  );
}

function CallerRenderer({ content }: { content: CallerContent }) {
  const { frame } = content;
  return (
    <Box flexDirection="column">
      <Text color="white">Called from:</Text>
      <Text>
        <Text color="cyanBright">{frame.file_name}</Text>
        <Text color="yellowBright">:{frame.line_number}</Text>
        {frame.method && (
          <Text color="white"> in <Text color="magentaBright">{frame.class ? `${frame.class}::` : ''}{frame.method}</Text></Text>
        )}
      </Text>
    </Box>
  );
}

function FileContentsRenderer({ content }: { content: FileContentsContent }) {
  // Try to detect language from file extension
  const ext = content.file.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    php: 'php',
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    sql: 'sql',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    md: 'markdown',
    sh: 'bash',
    bash: 'bash',
  };
  const language = langMap[ext] || 'plaintext';

  return (
    <Box flexDirection="column">
      <Text color="cyanBright" bold>
        {content.file}
      </Text>
      <HighlightedCode code={content.contents} language={language} />
    </Box>
  );
}

function SeparatorRenderer() {
  return <Text color="white">{'─'.repeat(40)}</Text>;
}

function GenericRenderer({
  content,
  type,
}: {
  content: unknown;
  type: string;
}) {
  return (
    <Box flexDirection="column">
      <Text color="white" italic>
        ({type})
      </Text>
      {stringifyHighlighted(content)}
    </Box>
  );
}

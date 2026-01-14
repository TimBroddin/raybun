import React from 'react';
import { Box, Text } from 'ink';
import type { StoredPayload } from '../types';
import { getPreviewText, getTypeColor } from './renderers/index';

interface PayloadListProps {
  payloads: StoredPayload[];
  selectedIndex: number;
  height: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTypeLabel(type: string): string {
  // Shorten some common type names
  const shortNames: Record<string, string> = {
    executed_query: 'query',
    slow_query: 'slow',
    duplicate_query: 'dup',
    application_log: 'app_log',
    file_contents: 'file',
  };
  return shortNames[type] || type;
}

export function PayloadList({ payloads, selectedIndex, height }: PayloadListProps) {
  // Calculate visible window
  const itemHeight = 2; // Each item takes 2 lines
  const visibleItems = Math.floor(height / itemHeight);

  // Scroll to keep selected item visible
  let startIndex = 0;
  if (selectedIndex >= visibleItems) {
    startIndex = selectedIndex - visibleItems + 1;
  }

  const visiblePayloads = payloads.slice(startIndex, startIndex + visibleItems);

  if (payloads.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray" italic>
          Waiting for payloads...
        </Text>
        <Text color="gray" dimColor>
          Send ray() calls from your Laravel app
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {visiblePayloads.map((payload, index) => {
        const actualIndex = startIndex + index;
        const isSelected = actualIndex === selectedIndex;
        const typeColor = payload.color || getTypeColor(payload.type);

        return (
          <Box
            key={payload.id}
            flexDirection="column"
            paddingX={1}
            borderStyle={isSelected ? 'round' : undefined}
            borderColor={isSelected ? 'cyanBright' : undefined}
          >
            <Box>
              <Text color="white">
                {formatTime(payload.timestamp)}{' '}
              </Text>
              <Text color={typeColor} bold>
                [{formatTypeLabel(payload.type)}]
              </Text>
              {payload.label && (
                <Text color="cyanBright"> {payload.label}</Text>
              )}
            </Box>
            <Text color={isSelected ? 'whiteBright' : 'white'} wrap="truncate">
              {'  '}{getPreviewText(payload)}
            </Text>
          </Box>
        );
      })}
      {payloads.length > visibleItems && (
        <Box paddingX={1} marginTop={1}>
          <Text color="white">
            {startIndex > 0 && '↑ '}
            {selectedIndex + 1}/{payloads.length}
            {startIndex + visibleItems < payloads.length && ' ↓'}
          </Text>
        </Box>
      )}
    </Box>
  );
}

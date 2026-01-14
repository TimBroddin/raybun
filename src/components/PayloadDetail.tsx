import React from 'react';
import { Box, Text } from 'ink';
import type { StoredPayload } from '../types';
import { renderDetail, getTypeColor } from './renderers/index';

interface PayloadDetailProps {
  payload: StoredPayload | null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function PayloadDetail({ payload }: PayloadDetailProps) {
  if (!payload) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="white" italic>
          Select a payload to view details
        </Text>
      </Box>
    );
  }

  const typeColor = payload.color || getTypeColor(payload.type);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={typeColor} bold>
          {payload.type.toUpperCase()}
        </Text>
        {payload.label && (
          <Text color="cyan"> - {payload.label}</Text>
        )}
      </Box>

      {/* Metadata */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="white">
          Time: <Text color="whiteBright">{formatTime(payload.timestamp)}</Text> <Text color="white">({formatRelativeTime(payload.timestamp)})</Text>
        </Text>
        {payload.origin && (
          <>
            <Text color="white">
              File: <Text color="cyanBright">{payload.origin.file}</Text>
              <Text color="yellowBright">:{payload.origin.line_number}</Text>
            </Text>
            {payload.origin.function_name && (
              <Text color="white">
                Function: <Text color="magentaBright">{payload.origin.class_name && `${payload.origin.class_name}::`}{payload.origin.function_name}</Text>
              </Text>
            )}
            {payload.origin.hostname && (
              <Text color="white">Host: <Text color="whiteBright">{payload.origin.hostname}</Text></Text>
            )}
          </>
        )}
        {payload.meta?.project_name && (
          <Text color="white">Project: <Text color="whiteBright">{payload.meta.project_name}</Text></Text>
        )}
      </Box>

      {/* Separator */}
      <Text color="gray">{'─'.repeat(40)}</Text>

      {/* Content */}
      <Box flexDirection="column" marginTop={1}>
        {renderDetail(payload)}
      </Box>

      {/* Meta info */}
      {payload.meta && (
        <Box marginTop={1} flexDirection="column">
          <Text color="gray" dimColor>
            {payload.meta.php_version && `PHP ${payload.meta.php_version}`}
            {payload.meta.laravel_version && ` | Laravel ${payload.meta.laravel_version}`}
          </Text>
        </Box>
      )}
    </Box>
  );
}

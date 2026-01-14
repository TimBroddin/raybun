import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { store } from '../store';
import type { StoredPayload } from '../types';
import { PayloadList } from './PayloadList';
import { PayloadDetail } from './PayloadDetail';
import { getPreviewText } from './renderers/index';

interface AppProps {
  port: number;
}

export function App({ port }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const [payloads, setPayloads] = useState<StoredPayload[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Track previous payload count for follow mode
  const prevPayloadCount = useRef(0);

  // Get terminal dimensions
  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;

  // Filter payloads based on search query
  const filteredPayloads = useMemo(() => {
    if (!searchQuery.trim()) return payloads;
    const query = searchQuery.toLowerCase();
    return payloads.filter((payload) => {
      // Search in type
      if (payload.type.toLowerCase().includes(query)) return true;
      // Search in label
      if (payload.label?.toLowerCase().includes(query)) return true;
      // Search in preview text (content)
      if (getPreviewText(payload).toLowerCase().includes(query)) return true;
      // Search in origin file
      if (payload.origin?.file.toLowerCase().includes(query)) return true;
      // Search in origin function
      if (payload.origin?.function_name?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [payloads, searchQuery]);

  // Subscribe to store updates
  useEffect(() => {
    const updatePayloads = () => {
      const newPayloads = store.getPayloads();
      setPayloads(newPayloads);

      // Auto-scroll to newest payload in follow mode (only when not searching)
      if (followMode && !searchQuery && newPayloads.length > prevPayloadCount.current) {
        setSelectedIndex(newPayloads.length - 1);
      }
      prevPayloadCount.current = newPayloads.length;
    };

    // Initial load
    updatePayloads();

    // Subscribe to changes
    const unsubscribe = store.subscribe(updatePayloads);
    return unsubscribe;
  }, [followMode, searchQuery]);

  // Reset selection when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredPayloads.length) {
      setSelectedIndex(Math.max(0, filteredPayloads.length - 1));
    }
  }, [filteredPayloads.length, selectedIndex]);

  // Keyboard handling
  useInput((input, key) => {
    // Help screen - any key closes
    if (showHelp) {
      setShowHelp(false);
      return;
    }

    // Search mode input handling
    if (searchMode) {
      if (key.escape || (key.return && input === '')) {
        // Exit search mode
        setSearchMode(false);
        return;
      }
      if (key.return) {
        // Confirm search and exit search mode
        setSearchMode(false);
        return;
      }
      if (key.backspace || key.delete) {
        setSearchQuery((prev) => prev.slice(0, -1));
        return;
      }
      // Add character to search
      if (input && !key.ctrl && !key.meta) {
        setSearchQuery((prev) => prev + input);
      }
      return;
    }

    // Normal mode

    // Quit
    if (input === 'q' || input === 'Q') {
      exit();
      return;
    }

    // Help
    if (input === '?' || input === 'h') {
      setShowHelp(true);
      return;
    }

    // Clear
    if (input === 'c' || input === 'C') {
      store.clear();
      setSelectedIndex(0);
      setSearchQuery('');
      return;
    }

    // Enter search mode
    if (input === '/' || input === 's') {
      setSearchMode(true);
      setFollowMode(false);
      return;
    }

    // Clear search with Escape
    if (key.escape) {
      if (searchQuery) {
        setSearchQuery('');
        setSelectedIndex(0);
      }
      return;
    }

    // Toggle follow mode
    if (input === 'f' || input === 'F') {
      setFollowMode((prev) => !prev);
      // If enabling follow mode, jump to bottom and clear search
      if (!followMode) {
        setSearchQuery('');
        setSelectedIndex(Math.max(0, payloads.length - 1));
      }
      return;
    }

    // Navigation - disable follow mode when manually navigating
    if (key.upArrow || input === 'k') {
      setFollowMode(false);
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setFollowMode(false);
      setSelectedIndex((prev) => Math.min(filteredPayloads.length - 1, prev + 1));
      return;
    }

    // Jump to top
    if (input === 'g') {
      setFollowMode(false);
      setSelectedIndex(0);
      return;
    }

    // Jump to bottom (and enable follow mode, clear search)
    if (input === 'G') {
      setFollowMode(true);
      setSearchQuery('');
      setSelectedIndex(Math.max(0, payloads.length - 1));
      return;
    }

    // Page up/down
    if (key.pageUp) {
      setFollowMode(false);
      setSelectedIndex((prev) => Math.max(0, prev - 10));
      return;
    }

    if (key.pageDown) {
      setFollowMode(false);
      setSelectedIndex((prev) => Math.min(filteredPayloads.length - 1, prev + 10));
      return;
    }
  });

  const selectedPayload = filteredPayloads[selectedIndex] ?? null;

  // Calculate panel sizes
  const listWidth = Math.floor(terminalWidth * 0.4);
  const detailWidth = terminalWidth - listWidth - 3; // Account for borders
  const contentHeight = terminalHeight - 4; // Account for header and footer

  if (showHelp) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyanBright"
        padding={1}
      >
        <Text color="cyanBright" bold>
          Raybun - Keyboard Shortcuts
        </Text>
        <Text> </Text>
        <Text color="white">
          <Text color="yellowBright">↑/k</Text> - Move up
        </Text>
        <Text color="white">
          <Text color="yellowBright">↓/j</Text> - Move down
        </Text>
        <Text color="white">
          <Text color="yellowBright">g</Text> - Go to top
        </Text>
        <Text color="white">
          <Text color="yellowBright">G</Text> - Go to bottom (enable follow)
        </Text>
        <Text color="white">
          <Text color="yellowBright">PgUp/PgDn</Text> - Page up/down
        </Text>
        <Text color="white">
          <Text color="yellowBright">/</Text> or <Text color="yellowBright">s</Text> - Search/filter payloads
        </Text>
        <Text color="white">
          <Text color="yellowBright">Esc</Text> - Clear search
        </Text>
        <Text color="white">
          <Text color="yellowBright">f</Text> - Toggle follow mode
        </Text>
        <Text color="white">
          <Text color="yellowBright">c</Text> - Clear all payloads
        </Text>
        <Text color="white">
          <Text color="yellowBright">?/h</Text> - Show this help
        </Text>
        <Text color="white">
          <Text color="yellowBright">q</Text> - Quit
        </Text>
        <Text> </Text>
        <Text color="white" italic>
          Press any key to close
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Main content */}
      <Box flexDirection="row" height={contentHeight + 4}>
        {/* Left panel - Payload list */}
        <Box
          flexDirection="column"
          width={listWidth}
          borderStyle="single"
          borderColor="white"
        >
          <PayloadList
            payloads={filteredPayloads}
            selectedIndex={selectedIndex}
            height={contentHeight + 2}
          />
        </Box>

        {/* Right panel - Detail view */}
        <Box
          flexDirection="column"
          width={detailWidth}
          borderStyle="single"
          borderColor="white"
        >
          <Box flexDirection="column" overflow="hidden">
            <PayloadDetail payload={selectedPayload} />
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        borderStyle="single"
        borderColor={searchMode ? 'yellowBright' : 'cyanBright'}
        paddingX={1}
        justifyContent="space-between"
      >
        {searchMode ? (
          <Text color="white">
            <Text color="yellowBright" bold>Search:</Text> {searchQuery}
            <Text color="white">█</Text>
          </Text>
        ) : (
          <Text color="white">
            <Text color="cyanBright" bold>Raybun</Text> :{port} |{' '}
            {searchQuery ? (
              <Text color="yellowBright">{filteredPayloads.length}/{payloads.length} matching "{searchQuery}"</Text>
            ) : (
              <Text>{payloads.length} payloads</Text>
            )}
            {' '}|{' '}
            {followMode ? (
              <Text color="greenBright" bold>FOLLOW</Text>
            ) : (
              <Text color="white">follow</Text>
            )}
          </Text>
        )}
        <Text color="white">
          {searchMode ? (
            <Text><Text color="yellowBright">Enter</Text> confirm | <Text color="yellowBright">Esc</Text> cancel</Text>
          ) : (
            <Text>
              <Text color="yellowBright">/</Text> search | <Text color="yellowBright">f</Text> follow | <Text color="yellowBright">c</Text> clear | <Text color="yellowBright">?</Text> help | <Text color="yellowBright">q</Text> quit
            </Text>
          )}
        </Text>
      </Box>
    </Box>
  );
}

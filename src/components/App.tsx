import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { store } from '../store';
import type { StoredPayload } from '../types';
import { PayloadList } from './PayloadList';
import { PayloadDetail } from './PayloadDetail';

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

  // Track previous payload count for follow mode
  const prevPayloadCount = useRef(0);

  // Get terminal dimensions
  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;

  // Subscribe to store updates
  useEffect(() => {
    const updatePayloads = () => {
      const newPayloads = store.getPayloads();
      setPayloads(newPayloads);

      // Auto-scroll to newest payload in follow mode
      if (followMode && newPayloads.length > prevPayloadCount.current) {
        setSelectedIndex(newPayloads.length - 1);
      }
      prevPayloadCount.current = newPayloads.length;
    };

    // Initial load
    updatePayloads();

    // Subscribe to changes
    const unsubscribe = store.subscribe(updatePayloads);
    return unsubscribe;
  }, [followMode]);

  // Keyboard handling
  useInput((input, key) => {
    if (showHelp) {
      // Any key closes help
      setShowHelp(false);
      return;
    }

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
      return;
    }

    // Toggle follow mode
    if (input === 'f' || input === 'F') {
      setFollowMode((prev) => !prev);
      // If enabling follow mode, jump to bottom
      if (!followMode) {
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
      setSelectedIndex((prev) => Math.min(payloads.length - 1, prev + 1));
      return;
    }

    // Jump to top
    if (input === 'g') {
      setFollowMode(false);
      setSelectedIndex(0);
      return;
    }

    // Jump to bottom (and enable follow mode)
    if (input === 'G') {
      setFollowMode(true);
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
      setSelectedIndex((prev) => Math.min(payloads.length - 1, prev + 10));
      return;
    }
  });

  const selectedPayload = payloads[selectedIndex] ?? null;

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
      <Box flexDirection="row" height={contentHeight + 2}>
        {/* Left panel - Payload list */}
        <Box
          flexDirection="column"
          width={listWidth}
          borderStyle="single"
          borderColor="white"
        >
          <Box paddingX={1} borderStyle="single" borderColor="white" borderBottom>
            <Text color="whiteBright" bold>
              Payloads
            </Text>
          </Box>
          <PayloadList
            payloads={payloads}
            selectedIndex={selectedIndex}
            height={contentHeight - 1}
          />
        </Box>

        {/* Right panel - Detail view */}
        <Box
          flexDirection="column"
          width={detailWidth}
          borderStyle="single"
          borderColor="white"
        >
          <Box paddingX={1} borderStyle="single" borderColor="white" borderBottom>
            <Text color="whiteBright" bold>
              Detail
            </Text>
          </Box>
          <Box flexDirection="column" overflow="hidden">
            <PayloadDetail payload={selectedPayload} />
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        borderStyle="single"
        borderColor="cyanBright"
        paddingX={1}
        justifyContent="space-between"
      >
        <Text color="white">
          <Text color="cyanBright" bold>Raybun</Text> :{port} | {payloads.length} payloads |{' '}
          {followMode ? (
            <Text color="greenBright" bold>FOLLOW</Text>
          ) : (
            <Text color="white">follow</Text>
          )}
        </Text>
        <Text color="white">
          ↑↓ navigate | <Text color="yellowBright">f</Text> follow | <Text color="yellowBright">c</Text> clear | <Text color="yellowBright">?</Text> help | <Text color="yellowBright">q</Text> quit
        </Text>
      </Box>
    </Box>
  );
}

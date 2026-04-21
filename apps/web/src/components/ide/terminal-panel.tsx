import { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal, Trash2, Loader2, AlertCircle, Power, PowerOff, Circle } from 'lucide-react';
import { useIDEStore } from '@/lib/ide-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import '@xterm/xterm/css/xterm.css';

interface TerminalPanelProps {
  height: number;
  repoId?: string;
  owner?: string;
  repo?: string;
}

type TerminalTab = 'output' | 'sandbox';
type SandboxState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Premium terminal theme inspired by best-in-class terminals (Warp, iTerm2, Hyper)
const xtermTheme = {
  // Background with subtle warmth for reduced eye strain
  background: '#0c0c0f', // Slightly warmer than pure black
  foreground: '#e8e8ed', // Soft white for better contrast
  cursor: '#10b981', // Emerald cursor matching brand
  cursorAccent: '#0c0c0f',
  selectionBackground: 'rgba(16, 185, 129, 0.25)', // Brand color selection
  selectionForeground: '#ffffff',
  // ANSI colors - carefully tuned for readability
  black: '#1a1a1f',
  red: '#ff6b6b', // Softer red
  green: '#10b981', // Brand emerald
  yellow: '#fbbf24', // Amber
  blue: '#60a5fa', // Soft blue
  magenta: '#c084fc', // Purple
  cyan: '#22d3ee', // Cyan
  white: '#e8e8ed',
  // Bright variants
  brightBlack: '#71717a', // zinc-500
  brightRed: '#fca5a5',
  brightGreen: '#34d399', // Brighter emerald
  brightYellow: '#fde047',
  brightBlue: '#93c5fd',
  brightMagenta: '#d8b4fe',
  brightCyan: '#67e8f9',
  brightWhite: '#ffffff',
};

export function TerminalPanel({ height, repoId, owner, repo }: TerminalPanelProps) {
  const { terminalOutputs, clearTerminal } = useIDEStore();
  const [activeTab, setActiveTab] = useState<TerminalTab>('output');
  const [sandboxState, setSandboxState] = useState<SandboxState>('disconnected');
  
  // Output terminal refs (xterm.js for proper terminal rendering)
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const outputXtermRef = useRef<XTerm | null>(null);
  const outputFitAddonRef = useRef<FitAddon | null>(null);
  const lastOutputCountRef = useRef(0);
  
  // Sandbox terminal refs
  const sandboxContainerRef = useRef<HTMLDivElement>(null);
  const sandboxXtermRef = useRef<XTerm | null>(null);
  const sandboxFitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Check if sandbox is available for this repo
  const { data: sandboxStatus } = trpc.sandbox.getStatus.useQuery(
    { repoId: repoId! },
    { enabled: !!repoId }
  );

  const sandboxAvailable = sandboxStatus?.ready ?? false;

  // Initialize output xterm.js terminal
  useEffect(() => {
    if (activeTab !== 'output' || !outputContainerRef.current || outputXtermRef.current) return;

    const xterm = new XTerm({
      theme: xtermTheme,
      // Premium font stack with ligature support
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      fontWeight: '400',
      fontWeightBold: '600',
      lineHeight: 1.5,
      letterSpacing: 0,
      cursorBlink: false,
      cursorStyle: 'bar',
      cursorWidth: 2,
      scrollback: 10000,
      tabStopWidth: 4,
      disableStdin: true, // Output terminal is read-only
      convertEol: true, // Convert \n to \r\n for proper line breaks
      scrollOnUserInput: true,
      fastScrollModifier: 'alt', // Hold alt for fast scrolling
      smoothScrollDuration: 0, // Instant scrolling for better responsiveness
      allowProposedApi: true,
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 4.5, // WCAG AA contrast
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    xterm.open(outputContainerRef.current);
    
    outputXtermRef.current = xterm;
    outputFitAddonRef.current = fitAddon;

    // Fit after a short delay to ensure container has dimensions
    const fitTerminal = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit errors during initialization
      }
    };

    // Initial fit with multiple attempts for reliability
    requestAnimationFrame(() => {
      fitTerminal();
      // Second fit after layout settles
      setTimeout(fitTerminal, 100);
    });

    // Handle resize with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(fitTerminal);
    });
    resizeObserver.observe(outputContainerRef.current);

    // Write existing outputs
    for (const output of terminalOutputs) {
      writeOutputToXterm(xterm, output);
    }
    lastOutputCountRef.current = terminalOutputs.length;

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
      outputXtermRef.current = null;
      outputFitAddonRef.current = null;
    };
  }, [activeTab]); // Only depend on activeTab, not terminalOutputs

  // Write new outputs to xterm when they change
  useEffect(() => {
    if (!outputXtermRef.current || activeTab !== 'output') return;
    
    const xterm = outputXtermRef.current;
    const newOutputs = terminalOutputs.slice(lastOutputCountRef.current);
    
    for (const output of newOutputs) {
      writeOutputToXterm(xterm, output);
    }
    
    lastOutputCountRef.current = terminalOutputs.length;
  }, [terminalOutputs, activeTab]);

  // Helper to write terminal output with proper formatting
  const writeOutputToXterm = (xterm: XTerm, output: { command: string; output: string; exitCode?: number; isRunning: boolean }) => {
    // Command prompt
    xterm.writeln(`\x1b[32m❯\x1b[0m \x1b[1m${output.command}\x1b[0m`);
    
    // Output content - write as-is to preserve ANSI codes
    if (output.output) {
      // Split by lines and write each, handling both \n and \r\n
      const lines = output.output.split(/\r?\n/);
      for (const line of lines) {
        xterm.writeln(line);
      }
    }
    
    // Status indicator
    if (output.isRunning) {
      xterm.writeln('\x1b[33m⟳ running...\x1b[0m');
    } else if (output.exitCode !== undefined) {
      if (output.exitCode === 0) {
        xterm.writeln(`\x1b[32m✓ exit code: ${output.exitCode}\x1b[0m`);
      } else {
        xterm.writeln(`\x1b[31m✗ exit code: ${output.exitCode}\x1b[0m`);
      }
    }
    
    xterm.writeln(''); // Blank line between commands
  };

  // Initialize sandbox xterm.js terminal
  useEffect(() => {
    if (activeTab !== 'sandbox' || !sandboxContainerRef.current || sandboxXtermRef.current) return;
    if (!sandboxAvailable) return;

    const xterm = new XTerm({
      theme: xtermTheme,
      // Premium font stack with ligature support
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      fontWeight: '400',
      fontWeightBold: '600',
      lineHeight: 1.5,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      scrollback: 10000,
      tabStopWidth: 4,
      scrollOnUserInput: true,
      fastScrollModifier: 'alt',
      smoothScrollDuration: 0,
      allowProposedApi: true,
      macOptionIsMeta: true,
      macOptionClickForcesSelection: true,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 4.5, // WCAG AA contrast
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    xterm.open(sandboxContainerRef.current);
    
    sandboxXtermRef.current = xterm;
    sandboxFitAddonRef.current = fitAddon;

    // Fit after a short delay to ensure container has dimensions
    const fitTerminal = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit errors during initialization
      }
    };

    // Initial fit with multiple attempts for reliability
    requestAnimationFrame(() => {
      fitTerminal();
      setTimeout(fitTerminal, 100);
    });

    // Handle resize with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(fitTerminal);
    });
    resizeObserver.observe(sandboxContainerRef.current);

    // Welcome message
    xterm.writeln('\x1b[1;36mSandbox Terminal\x1b[0m');
    xterm.writeln(`Repository: ${owner}/${repo}`);
    xterm.writeln('');
    xterm.writeln('Click "Connect" to start an interactive session.');
    xterm.writeln('');

    return () => {
      resizeObserver.disconnect();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      xterm.dispose();
      sandboxXtermRef.current = null;
      sandboxFitAddonRef.current = null;
    };
  }, [activeTab, sandboxAvailable, owner, repo]);

  // Handle resize when height changes
  useEffect(() => {
    requestAnimationFrame(() => {
      if (activeTab === 'output' && outputFitAddonRef.current) {
        outputFitAddonRef.current.fit();
      } else if (activeTab === 'sandbox' && sandboxFitAddonRef.current) {
        sandboxFitAddonRef.current.fit();
      }
    });
  }, [height, activeTab]);

  // Connect to sandbox WebSocket
  const connectToSandbox = useCallback(async () => {
    if (sandboxState === 'connecting' || sandboxState === 'connected') return;
    if (!sandboxXtermRef.current || !repoId) return;

    const xterm = sandboxXtermRef.current;
    setSandboxState('connecting');

    xterm.clear();
    xterm.writeln('\x1b[33mConnecting to sandbox...\x1b[0m');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const apiHost = apiUrl ? new URL(apiUrl).host : window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${apiHost}/api/sandbox/ws/${repoId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setSandboxState('connected');
        xterm.writeln('\x1b[32mConnected!\x1b[0m');
        xterm.writeln('');

        // Send initial config
        ws.send(JSON.stringify({
          type: 'init',
          cols: xterm.cols,
          rows: xterm.rows,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'data':
              xterm.write(msg.data);
              break;
            case 'error':
              xterm.writeln(`\x1b[31mError: ${msg.message}\x1b[0m`);
              break;
            case 'exit':
              xterm.writeln(`\x1b[33mSession ended (exit code: ${msg.code})\x1b[0m`);
              disconnectFromSandbox();
              break;
          }
        } catch {
          // Binary data or invalid JSON - write as-is
          xterm.write(event.data);
        }
      };

      ws.onclose = () => {
        xterm.writeln('\x1b[33mDisconnected\x1b[0m');
        setSandboxState('disconnected');
      };

      ws.onerror = () => {
        setSandboxState('error');
        xterm.writeln('\x1b[31mConnection failed\x1b[0m');
      };

      // Handle user input
      xterm.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });

      // Handle resize
      xterm.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      });
    } catch (err) {
      setSandboxState('error');
      xterm.writeln(`\x1b[31mFailed to connect: ${err}\x1b[0m`);
    }
  }, [repoId, sandboxState]);

  // Disconnect from sandbox
  const disconnectFromSandbox = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSandboxState('disconnected');
  }, []);

  // Clear output terminal
  const clearOutputTerminal = useCallback(() => {
    if (outputXtermRef.current) {
      outputXtermRef.current.clear();
    }
    clearTerminal(); // Also clear the store
    lastOutputCountRef.current = 0;
  }, [clearTerminal]);

  // Clear sandbox terminal
  const clearSandboxTerminal = useCallback(() => {
    if (sandboxXtermRef.current) {
      sandboxXtermRef.current.clear();
    }
  }, []);

  return (
    <div className="terminal-container flex flex-col border-t border-zinc-800/50 bg-[#0c0c0f]" style={{ height }}>
      {/* Premium Terminal Header */}
      <div className="terminal-header flex items-center justify-between h-9 px-3 border-b border-zinc-800/50 flex-shrink-0 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40">
        {/* Left side - Traffic lights & tabs */}
        <div className="flex items-center gap-3">
          {/* Traffic light buttons */}
          <div className="flex items-center gap-1.5 mr-1">
            <button 
              className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors group relative"
              title="Close"
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-red-900 text-[8px] font-bold">×</span>
            </button>
            <button 
              className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors group relative"
              title="Minimize"
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-yellow-900 text-[8px] font-bold">−</span>
            </button>
            <button 
              className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors group relative"
              title="Maximize"
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-green-900 text-[8px] font-bold">+</span>
            </button>
          </div>
          
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all"
            onClick={clearSandboxTerminal}
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div 
          ref={outputContainerRef} 
          className="terminal-content flex-1 min-h-0"
        />
      </div>
    </div>
  );
}

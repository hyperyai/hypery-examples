/**
 * Terminal Component
 * Browser-based terminal using xterm.js and WebContainers
 */

'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { getWebContainer, isWebContainerSupported } from '@/lib/terminal/webcontainer';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  onReady?: () => void;
}

// Memo to prevent unnecessary re-renders
const TerminalComponent = memo(function Terminal({ onReady }: TerminalProps) {
  console.log('🔵 Terminal component rendering');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    // Check if WebContainers is supported
    if (!isWebContainerSupported()) {
      setIsSupported(false);
      setIsBooting(false);
      return;
    }

    let resizeObserver: ResizeObserver | null = null;
    let mounted = true;

    // Shared function to safely fit terminal with dimension checks
    const safelyFitTerminal = (): boolean => {
      if (!mounted || !terminalRef.current || !fitAddonRef.current || !xtermRef.current) return false;
      
      // Check container dimensions
      const { offsetWidth, offsetHeight } = terminalRef.current;
      if (offsetWidth === 0 || offsetHeight === 0) {
        return false;
      }
      
      // Check if terminal's viewport is initialized
      // @ts-ignore - accessing internal xterm properties to prevent crashes
      if (!xtermRef.current.element) {
        return false;
      }
      
      try {
        // The fit() call internally checks for viewport dimensions
        // If not ready, it will throw an error which we catch
        fitAddonRef.current.fit();
        return true;
      } catch (error) {
        // Silent fail - viewport not ready yet, will retry on next resize
        return false;
      }
    };

    // Initialize terminal
    const initTerminal = async () => {
      if (!terminalRef.current || !mounted) return;
      
      // Only proceed if container has dimensions
      const { offsetWidth, offsetHeight } = terminalRef.current;
      if (offsetWidth === 0 || offsetHeight === 0) {
        // Container not ready - set up observer to retry when it is
        const containerObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0 && mounted) {
              containerObserver.disconnect();
              initTerminal(); // Retry initialization
            }
          }
        });
        
        containerObserver.observe(terminalRef.current);
        return;
      }

      // Create xterm instance with VS Code Dark+ theme
      const term = new XTerm({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1E1E1E',        // --bg-primary
          foreground: '#CCCCCC',        // --text-secondary
          cursor: '#FFFFFF',            // --text-primary
          cursorAccent: '#1E1E1E',
          selectionBackground: '#264F78',
          black: '#000000',
          red: '#CD3131',
          green: '#0DBC79',
          yellow: '#E5E510',
          blue: '#2472C8',
          magenta: '#BC3FBC',
          cyan: '#11A8CD',
          white: '#E5E5E5',
          brightBlack: '#666666',
          brightRed: '#F14C4C',
          brightGreen: '#23D18B',
          brightYellow: '#F5F543',
          brightBlue: '#3B8EEA',
          brightMagenta: '#D670D6',
          brightCyan: '#29B8DB',
          brightWhite: '#E5E5E5',
        },
        convertEol: true,
        scrollback: 1000,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(terminalRef.current);
      
      // Store refs immediately after opening
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
      
      // Wait for terminal viewport to initialize before fitting
      // The viewport is initialized asynchronously after open()
      const waitForViewport = () => {
        return new Promise<void>((resolve) => {
          let attempts = 0;
          const maxAttempts = 50; // 50 frames = ~833ms at 60fps
          
          const checkViewport = () => {
            attempts++;
            // @ts-ignore
            if (xtermRef.current?._core?.viewport?.dimensions) {
              console.log('✅ Terminal viewport ready after', attempts, 'frames');
              resolve();
            } else if (attempts >= maxAttempts) {
              console.log('⚠️ Terminal viewport timeout, proceeding anyway');
              resolve();
            } else {
              requestAnimationFrame(checkViewport);
            }
          };
          checkViewport();
        });
      };
      
      await waitForViewport();
      
      // Check if still mounted after async wait
      if (!mounted || !xtermRef.current) {
        console.log('🛑 Terminal unmounted while waiting for viewport');
        return;
      }
      
      // Set up ResizeObserver for fitting
      // This handles both initial fit and future resizes
      resizeObserver = new ResizeObserver(() => {
        if (mounted && safelyFitTerminal() && resizeObserver) {
          // Keep observer alive for window resizes - don't disconnect
        }
      });
      
      resizeObserver.observe(terminalRef.current);
      
      // Now safe to fit
      safelyFitTerminal();

      // Welcome message
      term.writeln('\x1b[1;32m🚀 Initializing WebContainer...\x1b[0m');
      term.writeln('');

      try {
        // Boot WebContainer
        const webcontainer = await getWebContainer();
        
        // Check if component unmounted during async operation
        if (!mounted || !xtermRef.current) {
          console.log('🛑 Terminal unmounted during WebContainer boot');
          return;
        }

        term.writeln('\x1b[1;32m✅ WebContainer ready!\x1b[0m');
        term.writeln('\x1b[90mYou can now run Node.js, npm, and other commands.\x1b[0m');
        term.writeln('');

        // Spawn shell
        const shell = await webcontainer.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });
        
        // Check again if component unmounted during spawn
        if (!mounted || !xtermRef.current) {
          console.log('🛑 Terminal unmounted during shell spawn');
          shell.kill();
          return;
        }

        // Connect shell output to terminal
        shell.output.pipeTo(
          new WritableStream({
            write(data) {
              // Only write if still mounted
              if (mounted && xtermRef.current) {
                term.write(data);
              }
            },
          })
        );

        // Connect terminal input to shell
        const shellWriter = shell.input.getWriter();
        term.onData((data) => {
          if (mounted) {
            shellWriter.write(data);
          }
        });

        // Handle terminal resize
        term.onResize(({ cols, rows }) => {
          if (mounted) {
            shell.resize({ cols, rows });
          }
        });

        if (mounted) {
          setIsBooting(false);
          onReady?.();
        }
      } catch (error) {
        console.error('Failed to boot WebContainer:', error);
        
        // Only write to terminal if still mounted
        if (mounted && xtermRef.current) {
          term.writeln('');
          term.writeln('\x1b[1;31m❌ Failed to start WebContainer\x1b[0m');
          term.writeln('\x1b[90mError: ' + (error as Error).message + '\x1b[0m');
          term.writeln('');
          term.writeln('\x1b[33mNote: WebContainers require cross-origin isolation.\x1b[0m');
          term.writeln('\x1b[33mMake sure these headers are set:\x1b[0m');
          term.writeln('\x1b[90m  Cross-Origin-Embedder-Policy: require-corp\x1b[0m');
          term.writeln('\x1b[90m  Cross-Origin-Opener-Policy: same-origin\x1b[0m');
          setIsBooting(false);
        }
      }
    };

    initTerminal();

    // Cleanup
    return () => {
      // Mark as unmounted to stop all callbacks
      mounted = false;
      
      // Clean up ResizeObserver
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      
      // Dispose terminal
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose();
          xtermRef.current = null;
        } catch (error) {
          console.warn('⚠️ Error disposing terminal:', error);
        }
      }
      
      fitAddonRef.current = null;
    };
  }, [onReady]);

  if (!isSupported) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-tertiary)]">
        <div className="text-center space-y-2 p-6">
          <p className="text-lg">⚠️ Terminal Not Supported</p>
          <p className="text-sm text-[var(--text-disabled)]">
            Your browser doesn't support WebContainers.
          </p>
          <p className="text-xs text-[var(--text-disabled)]">
            Try Chrome, Edge, or Firefox with cross-origin isolation enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] relative">
      <div
        ref={terminalRef}
        className="h-full w-full p-2"
        style={{ overflow: 'hidden' }}
      />
      {isBooting && (
        <div className="absolute inset-0 bg-[var(--bg-primary)]/80 flex items-center justify-center">
          <div className="text-[var(--text-tertiary)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--border-focus)] mx-auto mb-2"></div>
            <p className="text-sm">Booting container...</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Export the memoized component
export { TerminalComponent as Terminal };

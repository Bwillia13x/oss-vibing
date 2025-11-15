/**
 * Cursor Overlay Component
 * 
 * Displays real-time cursor positions and selections of other users.
 * Shows color-coded cursors with user name labels.
 * 
 * Week 2-3: Collaboration UI Components
 */

'use client';

import { useEffect, useState } from 'react';
import { UserPresence } from '@/lib/collaboration';

interface CursorOverlayProps {
  users: Map<number, UserPresence>;
  editorRef: React.RefObject<HTMLElement>;
  lineHeight?: number;
  charWidth?: number;
}

export function CursorOverlay({
  users,
  editorRef,
  lineHeight = 20,
  charWidth = 8,
}: CursorOverlayProps) {
  const [cursors, setCursors] = useState<UserPresence[]>([]);
  
  useEffect(() => {
    setCursors(
      Array.from(users.values()).filter((u) => u.cursor)
    );
  }, [users]);
  
  if (!editorRef.current) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {cursors.map((user) => {
        if (!user.cursor) return null;
        
        const position = calculateCursorPosition(
          user.cursor,
          editorRef.current!,
          lineHeight,
          charWidth
        );
        
        return (
          <div key={user.userId}>
            {/* Cursor caret */}
            <div
              className="absolute transition-all duration-100"
              style={{
                left: position.x,
                top: position.y,
                color: user.color,
              }}
            >
              <div className="w-0.5 h-5 bg-current animate-pulse" />
              
              {/* User name label */}
              <div
                className="absolute top-6 left-0 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap shadow-lg pointer-events-auto"
                style={{ backgroundColor: user.color }}
              >
                {user.userName}
              </div>
            </div>
            
            {/* Selection highlight */}
            {user.selection && (
              <SelectionHighlight
                selection={user.selection}
                color={user.color}
                editorRef={editorRef}
                lineHeight={lineHeight}
                charWidth={charWidth}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SelectionHighlightProps {
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  color: string;
  editorRef: React.RefObject<HTMLElement>;
  lineHeight: number;
  charWidth: number;
}

function SelectionHighlight({
  selection,
  color,
  editorRef,
  lineHeight,
  charWidth,
}: SelectionHighlightProps) {
  const startPos = calculateCursorPosition(
    selection.start,
    editorRef.current!,
    lineHeight,
    charWidth
  );
  
  const endPos = calculateCursorPosition(
    selection.end,
    editorRef.current!,
    lineHeight,
    charWidth
  );
  
  // Single line selection
  if (selection.start.line === selection.end.line) {
    return (
      <div
        className="absolute transition-all duration-100"
        style={{
          left: startPos.x,
          top: startPos.y,
          width: endPos.x - startPos.x,
          height: lineHeight,
          backgroundColor: color,
          opacity: 0.2,
        }}
      />
    );
  }
  
  // Multi-line selection (simplified - just show start and end lines)
  return (
    <>
      <div
        className="absolute transition-all duration-100"
        style={{
          left: startPos.x,
          top: startPos.y,
          width: '100%',
          height: lineHeight,
          backgroundColor: color,
          opacity: 0.2,
        }}
      />
      <div
        className="absolute transition-all duration-100"
        style={{
          left: 0,
          top: endPos.y,
          width: endPos.x,
          height: lineHeight,
          backgroundColor: color,
          opacity: 0.2,
        }}
      />
    </>
  );
}

function calculateCursorPosition(
  cursor: { line: number; column: number },
  editorElement: HTMLElement,
  lineHeight: number,
  charWidth: number
): { x: number; y: number } {
  // Get editor's scroll position
  const scrollTop = editorElement.scrollTop || 0;
  const scrollLeft = editorElement.scrollLeft || 0;
  
  // Calculate position based on line and column
  // This is a simplified calculation - real implementation would need to:
  // 1. Get actual line element
  // 2. Measure text width up to cursor position
  // 3. Account for tabs, variable-width fonts, etc.
  
  const x = cursor.column * charWidth - scrollLeft;
  const y = cursor.line * lineHeight - scrollTop;
  
  return { x, y };
}

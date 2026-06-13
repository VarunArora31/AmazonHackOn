"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VimNavigationOptions {
  /** Total number of items in the timeline */
  itemCount: number;
  /** Called when 'x' is pressed on focused item */
  onArchive?: (index: number) => void;
  /** Called when Enter is pressed on focused item */
  onSelect?: (index: number) => void;
  /** Callback to open command palette */
  onOpenSearch?: () => void;
}

interface VimNavigationReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  isFocusActive: boolean;
}

/**
 * Check if an element is a form field where normal typing should work.
 */
function isFormElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  // Also check role-based inputs
  const role = el.getAttribute("role");
  if (role === "textbox" || role === "searchbox") return true;
  return false;
}

/**
 * Vim-style keyboard navigation for timeline feeds.
 * Uses native event listeners for guaranteed browser compatibility.
 *
 * Bindings:
 * - `/`     → Open command palette (overrides browser Quick Find)
 * - `j`     → Move focus down
 * - `k`     → Move focus up
 * - `x`     → Archive/mute focused official event
 * - `Enter` → Mark focused personal task as done
 * - `Esc`   → Deactivate focus mode
 */
export function useVimNavigation({
  itemCount,
  onArchive,
  onSelect,
  onOpenSearch,
}: VimNavigationOptions): VimNavigationReturn {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isFocusActive, setIsFocusActive] = useState(false);

  // Refs to avoid stale closures in the event handler
  const focusedIndexRef = useRef(focusedIndex);
  const isFocusActiveRef = useRef(isFocusActive);
  const itemCountRef = useRef(itemCount);
  const onArchiveRef = useRef(onArchive);
  const onSelectRef = useRef(onSelect);
  const onOpenSearchRef = useRef(onOpenSearch);

  // Sync refs
  focusedIndexRef.current = focusedIndex;
  isFocusActiveRef.current = isFocusActive;
  itemCountRef.current = itemCount;
  onArchiveRef.current = onArchive;
  onSelectRef.current = onSelect;
  onOpenSearchRef.current = onOpenSearch;

  // Clamp index when item count changes
  useEffect(() => {
    if (focusedIndex >= itemCount) {
      setFocusedIndex(Math.max(0, itemCount - 1));
    }
    if (itemCount === 0) {
      setFocusedIndex(-1);
      setIsFocusActive(false);
    }
  }, [itemCount, focusedIndex]);

  // Auto-scroll to focused element
  useEffect(() => {
    if (focusedIndex < 0 || !isFocusActive) return;
    // Small delay to let React render the focused state
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-timeline-index="${focusedIndex}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [focusedIndex, isFocusActive]);

  // ─── Single keydown handler on document ───────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if typing in a form field
      if (isFormElement(e.target)) return;

      // Skip if modifier keys are held (allow Ctrl+C, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "/": {
          e.preventDefault();
          e.stopPropagation();
          onOpenSearchRef.current?.();
          break;
        }

        case "j": {
          e.preventDefault();
          if (itemCountRef.current === 0) return;
          setIsFocusActive(true);
          setFocusedIndex((prev) => Math.min(prev + 1, itemCountRef.current - 1));
          break;
        }

        case "k": {
          e.preventDefault();
          if (itemCountRef.current === 0) return;
          setIsFocusActive(true);
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }

        case "x": {
          e.preventDefault();
          const currentIndex = focusedIndexRef.current;
          const isActive = isFocusActiveRef.current;
          
          if (!isActive || currentIndex < 0) {
            // If not in focus mode, activate and target first item
            if (itemCountRef.current > 0) {
              setIsFocusActive(true);
              setFocusedIndex(0);
              focusedIndexRef.current = 0;
              isFocusActiveRef.current = true;
              onArchiveRef.current?.(0);
            }
          } else {
            onArchiveRef.current?.(currentIndex);
          }
          break;
        }

        case "Enter": {
          if (!isFocusActiveRef.current || focusedIndexRef.current < 0) return;
          e.preventDefault();
          onSelectRef.current?.(focusedIndexRef.current);
          break;
        }

        case "Escape": {
          setIsFocusActive(false);
          setFocusedIndex(-1);
          break;
        }
      }
    }

    // Use capture phase to beat browser's Quick Find on "/"
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  return { focusedIndex, setFocusedIndex, isFocusActive };
}

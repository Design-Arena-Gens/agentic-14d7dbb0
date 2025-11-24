"use client";

import { useEffect, useState } from "react";
import { createDefaultBoard } from "./defaultData";
import type { BoardState } from "./types";

const STORAGE_KEY = "flowforge-kanban-board";

export const useBoardState = () => {
  const [board, setBoard] = useState<BoardState>(() => createDefaultBoard());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BoardState;
        setBoard(parsed);
      }
    } catch (error) {
      console.error("Failed to load board from storage", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
      } catch (error) {
        console.error("Failed to persist board", error);
      }
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [board, hydrated]);

  return { board, setBoard, hydrated } as const;
};

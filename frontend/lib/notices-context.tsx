"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { notices as initialNotices, type Notice } from "./data";

interface NoticesContextType {
  notices: Notice[];
  addNotice: (notice: Notice) => void;
}

const NoticesContext = createContext<NoticesContextType | undefined>(undefined);

export function NoticesProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);

  const addNotice = (notice: Notice) => {
    setNotices((prev) => [notice, ...prev]);
  };

  return (
    <NoticesContext.Provider value={{ notices, addNotice }}>
      {children}
    </NoticesContext.Provider>
  );
}

export function useNotices() {
  const context = useContext(NoticesContext);
  if (!context) {
    throw new Error("useNotices must be used within a NoticesProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { UserPayload } from "./types";

// Default demo user — student
const defaultUser: UserPayload = {
  role: "STUDENT",
  name: "Arjun",
  branch: "CSE",
  year: 3,
  hostel: "Hostel 4",
};

const adminPresets: UserPayload[] = [
  { role: "ADMIN_HOSTEL", name: "Dr. Sharma", department: "Hostel Administration" },
  { role: "ADMIN_PLACEMENT", name: "Prof. Gupta", department: "Training & Placement" },
  { role: "ADMIN_ACADEMICS", name: "Prof. Verma", department: "Academic Affairs" },
  { role: "CLUB_LEAD", name: "Rahul K.", department: "Coding Club" },
  { role: "SPORTS_ADMIN", name: "Coach Singh", department: "Sports Department" },
];

interface UserContextType {
  user: UserPayload;
  setUser: (user: UserPayload) => void;
  switchToAdmin: (index?: number) => void;
  switchToStudent: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload>(defaultUser);

  const switchToAdmin = (index = 0) => {
    setUser(adminPresets[index % adminPresets.length]);
  };

  const switchToStudent = () => {
    setUser(defaultUser);
  };

  return (
    <UserContext.Provider value={{ user, setUser, switchToAdmin, switchToStudent }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

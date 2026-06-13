// ─── User & Role Types ─────────────────────────────────────────

export type StudentBranch =
  | "CSE"
  | "Data Science"
  | "ECE"
  | "Electrical"
  | "ME"
  | "ICE"
  | "Civil"
  | "IPE";

export type StudentYear = 1 | 2 | 3 | 4;

export type AdminRole =
  | "ADMIN_HOSTEL"
  | "ADMIN_PLACEMENT"
  | "ADMIN_ACADEMICS"
  | "CLUB_LEAD"
  | "SPORTS_ADMIN";

export type UserRole = "STUDENT" | AdminRole;

export interface StudentPayload {
  role: "STUDENT";
  name: string;
  branch: StudentBranch;
  year: StudentYear;
  hostel: string;
  avatar?: string;
}

export interface AdminPayload {
  role: AdminRole;
  name: string;
  department: string;
  avatar?: string;
}

export type UserPayload = StudentPayload | AdminPayload;

// ─── Route-to-Category Mapping ─────────────────────────────────

export type DashboardSection =
  | "academics"
  | "hostel"
  | "placement"
  | "club"
  | "sports";

/** Maps a route segment to the notice category it displays */
export const routeToCategoryMap: Record<DashboardSection, string> = {
  academics: "Academics",
  hostel: "Hostel Admin",
  placement: "Placement",
  club: "Club Event",
  sports: "Sports",
};

/** Maps admin roles to the routes they can publish on */
export const roleToRoutesMap: Record<AdminRole, string[]> = {
  ADMIN_HOSTEL: ["/dashboard", "/dashboard/hostel"],
  ADMIN_PLACEMENT: ["/dashboard", "/dashboard/placement"],
  ADMIN_ACADEMICS: ["/dashboard", "/dashboard/academics"],
  CLUB_LEAD: ["/dashboard", "/dashboard/club"],
  SPORTS_ADMIN: ["/dashboard", "/dashboard/sports"],
};

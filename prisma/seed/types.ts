export enum UserRole {
  NORMAL = "NORMAL",
  POWER = "POWER",
  CELEBRITY = "CELEBRITY",
}

export type SeedUser = {
  id: string;
  username: string;
  role: UserRole;
};
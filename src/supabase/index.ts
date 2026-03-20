// Supabase client
export { supabase } from "./client";
export type { SupabaseClient } from "./client";

// Database types
export type {
  User,
  UserInsert,
  UserUpdate,
  Org,
  OrgInsert,
  OrgUpdate,
  GitHubAppInstallation,
  GitHubAppInstallationInsert,
  GitHubAppInstallationUpdate,
  DeviceFlowSession,
  DeviceFlowSessionInsert,
  DeviceFlowSessionUpdate,
  RepositoryResult,
  RepositoryListResult,
} from "./types";

// Repositories
export { UserRepository, userRepository } from "./repositories/user-repository";
export { OrgRepository, orgRepository } from "./repositories/org-repository";
export {
  InstallationRepository,
  installationRepository,
} from "./repositories/installation-repository";
export {
  DeviceFlowRepository,
  deviceFlowRepository,
} from "./repositories/device-flow-repository";

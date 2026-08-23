export { auth, handlers, signIn, signOut } from "@/features/auth/auth";
export { authConfig } from "@/features/auth/auth.config";
export {
  passwordLoginSchema,
  officialLoginSchema,
  citizenEmailSchema,
  citizenOtpVerifySchema,
  citizenOtpProofSchema,
  registerCitizenSchema,
  createOfficialSchema,
  homePathForRole,
} from "@/features/auth/schemas";
export {
  requestCitizenOtpAction,
  registerCitizenWithOtpAction,
  verifyCitizenOtpAction,
  beginStaffSetupAction,
  completeStaffSetupAction,
  logoutAction,
} from "@/features/auth/actions";
export {
  createOfficialAction,
  createStudentAction,
  deleteManagedUserAction,
} from "@/features/admin/actions";
export { LoginForm } from "@/features/auth/components/login-form";
export { RegisterForm } from "@/features/auth/components/register-form";
export { LogoutButton } from "@/features/auth/components/logout-button";

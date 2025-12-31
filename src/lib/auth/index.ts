// Central export point for authentication utilities
export { verifyAuth, requireRole, verifyCronSecret } from './middleware';
export type { AuthenticatedRequest } from './middleware';

export { ROLES, isAdvertiser, isInfluencer, isAdmin } from './roles';

export {
  googleSignIn,
  handleGoogleSignInRedirect,
  checkExistingSignInMethods,
  checkUserDocumentExists,
  isMobileDevice
} from './googleAuth';
export type { GoogleSignInMethod, GoogleSignInResult } from './googleAuth';

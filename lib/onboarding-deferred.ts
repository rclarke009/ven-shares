/**
 * PDF-specified profile steps deferred until after Clerk account + `venRole` are set.
 * @see reference_docs/Small/ — Inventor file page, Login page pt 2 (professional).
 */
export const DEFERRED_INVENTOR_ONBOARDING = [
  "fileUploads",
  "displayName",
  "mailingAddress",
  "ideaSubmission",
] as const;

export const DEFERRED_PROFESSIONAL_ONBOARDING = [
  "idDriversLicense",
  "proofOfCitizenship",
  "ndas",
  "bankAccountForPayouts",
  "jobCategoriesUpTo5",
  "hoursPerWeek",
] as const;

/**
 * OTA Update changelog displayed in the "What's New" modal.
 *
 * Edit `items` before running `eas update`. Set to empty array for
 * silent patches (no modal shown to users).
 */
export const WHATS_NEW = {
  title: "What's New",
  items: [
    'OTA updates now work properly',
    'Fixed coach notification routing to trainee history',
    'Resolved false PR detection flags on tracked exercises',
    'Fixed admin exercise save and group creation RLS policies',
  ],
};

const COMPLETION_MESSAGES = [
  "Nice.",
  "One down.",
  "That counts.",
  "Momentum.",
  "Tiny win logged.",
  "Another hop forward.",
  "Done and dusted.",
  "You showed up.",
  "One hop at a time.",
  "Hop, done.",
  "Small steps, real progress.",
  "Logged. Carry on.",
];

const ALL_DONE_MESSAGES = [
  "That's everything — the burrow is cozy tonight.",
  "All done. Go enjoy your day.",
  "Every hop taken. Lovely.",
  "Clean sweep. 🥕",
];

const COMEBACK_MESSAGES = [
  "You came back. That matters more than a perfect streak.",
  "Picked it back up. That's the hard part done.",
  "Back at it. The gap doesn't undo the rest.",
  "Returning counts. Welcome back.",
];

let lastIndex = -1;
let lastComeback = -1;

export function completionMessage(): string {
  // Never repeat the previous message back-to-back
  let i = Math.floor(Math.random() * COMPLETION_MESSAGES.length);
  if (i === lastIndex) i = (i + 1) % COMPLETION_MESSAGES.length;
  lastIndex = i;
  return COMPLETION_MESSAGES[i];
}

export function allDoneMessage(): string {
  return ALL_DONE_MESSAGES[Math.floor(Math.random() * ALL_DONE_MESSAGES.length)];
}

export function comebackMessage(): string {
  // Was a single constant: logging several lapsed habits in a row repeated the
  // identical sentence each time, which turns reassurance into wallpaper.
  let i = Math.floor(Math.random() * COMEBACK_MESSAGES.length);
  if (i === lastComeback) i = (i + 1) % COMEBACK_MESSAGES.length;
  lastComeback = i;
  return COMEBACK_MESSAGES[i];
}

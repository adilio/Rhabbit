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

const COMEBACK_MESSAGE = "You came back. That matters more than a perfect streak.";

let lastIndex = -1;

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
  return COMEBACK_MESSAGE;
}

/** All UI text lives here. */
export const text = {
  title: 'Domindle',
  artAlt: "Today's card artwork",
  guessBanner: (n: number) => `Guess ${n}`,
  inputLabel: 'Guess the card',
  inputPlaceholder: 'Type a card name…',
  guessButton: 'Guess',
  suggestionsLabel: 'Matching cards',
  wrongGuessesLabel: 'Wrong guesses',
  shareTitle: 'Domindle Art',
  shareButton: 'Share',
  shareCopied: 'Result copied to clipboard!',
  shareFailed: "Couldn't copy to the clipboard. Your browser may be blocking it.",
  yesterdaysAnswer: (name: string) => `Yesterday's answer: ${name}`,
  nextPuzzle: (countdown: string) => `Next puzzle in ${countdown}`,
  noPuzzle: 'No puzzle today. Come back soon!',
  creditNote: 'Card art © Rio Grande Games. Non-commercial fan project.',
}

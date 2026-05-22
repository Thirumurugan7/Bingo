export function generateBingoCard(playerNumbers: number[], myNumber: number): number[][] {
  const others = playerNumbers.filter((n) => n !== myNumber);
  const shuffled = [...others].sort(() => Math.random() - 0.5);

  // 5x5 grid, center = 0 (FREE)
  const cells: number[] = [];
  for (let i = 0; i < 24; i++) {
    cells.push(shuffled[i % shuffled.length]);
  }
  cells.splice(12, 0, 0); // FREE center

  const grid: number[][] = [];
  for (let r = 0; r < 5; r++) {
    grid.push(cells.slice(r * 5, r * 5 + 5));
  }
  return grid;
}

export function checkBingo(card: number[][], crossedOff: number[]): boolean {
  const crossed = new Set([...crossedOff, 0]);

  const isMarked = (r: number, c: number) => crossed.has(card[r][c]);

  // rows
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => isMarked(r, c))) return true;
  }
  // cols
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => isMarked(r, c))) return true;
  }
  // diagonals
  if ([0, 1, 2, 3, 4].every((i) => isMarked(i, i))) return true;
  if ([0, 1, 2, 3, 4].every((i) => isMarked(i, 4 - i))) return true;

  return false;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

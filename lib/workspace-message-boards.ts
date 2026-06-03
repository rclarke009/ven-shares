export const TEAM_BOARD_PARAM = "team";

export function messageBoardLabel(category: string | null): string {
  if (category === null) return "Team message board";
  const short = category.split(" / ")[0]?.trim() || category;
  return `${short} message board`;
}

export function messageBoardShortName(category: string | null): string {
  if (category === null) return "Team";
  return category.split(" / ")[0]?.trim() || category;
}

export function messageActivityBoardSuffix(category: string | null): string {
  if (!category) return "";
  const short = messageBoardShortName(category);
  return ` for ${short}`;
}

export function boardParamFromCategory(category: string | null): string {
  if (category === null) return TEAM_BOARD_PARAM;
  return category;
}

export function resolveBoardCategory(
  boardParam: string | undefined,
  allowedCategories: readonly string[],
): string | null {
  if (!boardParam || boardParam === TEAM_BOARD_PARAM) return null;
  if (allowedCategories.includes(boardParam)) return boardParam;
  return null;
}

export function messagesMatchBoard(
  messageCategory: string | null,
  activeBoardCategory: string | null,
): boolean {
  if (activeBoardCategory === null) return messageCategory === null;
  return messageCategory === activeBoardCategory;
}

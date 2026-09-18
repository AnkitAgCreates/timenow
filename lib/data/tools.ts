import { HOME_TOOL_KEYS, TOOLS } from '@/data/tools';
import type { Tool } from '@/types/data';

export function getAllTools(): Tool[] {
  return TOOLS;
}

export function getHomeTools(): Tool[] {
  return HOME_TOOL_KEYS.map((key) => TOOLS.find((tool) => tool.key === key)).filter((t): t is Tool => Boolean(t));
}

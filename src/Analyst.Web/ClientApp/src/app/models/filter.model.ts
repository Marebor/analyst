import { Tag } from "./tag.model";

export interface Filter {
  id: number,
  tagNamesIfTrue: string[],
  tags: Tag[],
  keywords: string[],
}
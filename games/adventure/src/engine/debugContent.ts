import type { Chapter } from '../chapters/types';

/** Compatibility-only values remain valid saves, but are not current authoring controls. */
export function debugItems(chapter:Chapter):string[]{
 return chapter.items.filter(item=>!chapter.legacyItems?.includes(item));
}

export function debugFlags(chapter:Chapter,candidates:readonly string[]=chapter.flags):string[]{
 return candidates.filter(flag=>chapter.flags.includes(flag)&&!chapter.legacyFlags?.includes(flag));
}

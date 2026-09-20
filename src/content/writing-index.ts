export const WRITING_PAGE_SIZE = 6
export const WRITING_MAX_HIGHLIGHTS = 2

export function paginateWriting<T extends { id:string; highlight:boolean }>(
  posts:T[],
  page:number,
  pageSize = WRITING_PAGE_SIZE,
  maxHighlights = WRITING_MAX_HIGHLIGHTS,
) {
  const safePage = Math.max(1,Math.floor(page || 1))
  const highlights = posts.filter(post => post.highlight).slice(0,maxHighlights)
  const highlightIds = new Set(highlights.map(post => post.id))
  const regular = posts.filter(post => !highlightIds.has(post.id))
  const firstPageCapacity = Math.max(0,pageSize - highlights.length)
  const remainingAfterFirst = Math.max(0,regular.length - firstPageCapacity)
  const totalPages = Math.max(1,1 + Math.ceil(remainingAfterFirst / pageSize))

  const items = safePage === 1
    ? regular.slice(0,firstPageCapacity)
    : regular.slice(
        firstPageCapacity + (safePage - 2) * pageSize,
        firstPageCapacity + (safePage - 1) * pageSize,
      )

  return {
    page:safePage,
    totalPages,
    highlights:safePage === 1 ? highlights : [],
    items,
    pageItemCount:(safePage === 1 ? highlights.length : 0) + items.length,
  }
}

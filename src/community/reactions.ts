export const COMMUNITY_REACTIONS=['like','love','haha','wow','sad'] as const

export type CommunityReaction=typeof COMMUNITY_REACTIONS[number]

export const COMMUNITY_REACTION_META:Record<
  CommunityReaction,
  {emoji:string;labelEn:string;labelVi:string}
>={
  like:{emoji:'👍',labelEn:'Like',labelVi:'Thích'},
  love:{emoji:'❤️',labelEn:'Love',labelVi:'Yêu thích'},
  haha:{emoji:'😂',labelEn:'Haha',labelVi:'Haha'},
  wow:{emoji:'😮',labelEn:'Wow',labelVi:'Wow'},
  sad:{emoji:'😢',labelEn:'Sad',labelVi:'Buồn'},
}

export type CommunityReactionSummary=Record<CommunityReaction,number>

export const EMPTY_REACTION_SUMMARY:CommunityReactionSummary={
  like:0,
  love:0,
  haha:0,
  wow:0,
  sad:0,
}

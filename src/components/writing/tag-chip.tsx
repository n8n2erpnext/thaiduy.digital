import Link from 'next/link'

type Tag = {
  slug:string
  name:string
  color:string
  textColor:string
}

type Props = {
  tag:Tag
  href?:string
  className?:string
}

export function WritingTagChip({ tag, href, className }:Props) {
  const classes=['writing-tag-chip',className].filter(Boolean).join(' ')
  const style={
    backgroundColor:tag.color,
    color:tag.textColor,
    borderColor:tag.color,
  }
  const label='#'+tag.name
  if (href) {
    return <Link className={classes} href={href} style={style}>{label}</Link>
  }
  return <span className={classes} style={style}>{label}</span>
}

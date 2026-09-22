'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import type { Locale } from '@/i18n/config'

type FormState={
  name:string
  email:string
  phone:string
  message:string
  company:string
}

type Challenge={
  a:number
  b:number
  token:string
}

const initialForm:FormState={name:'',email:'',phone:'',message:'',company:''}

async function requestChallenge():Promise<Challenge|null> {
  try {
    const response=await fetch('/api/contact',{cache:'no-store'})
    const payload=await response.json().catch(()=>null) as {challenge?:Challenge}|null
    if (!response.ok || !payload?.challenge) return null
    return payload.challenge
  } catch {
    return null
  }
}

export function ContactChannel({locale,initialChallenge}:{locale:Locale;initialChallenge:Challenge|null}) {
  const vi=locale==='vi'
  const [form,setForm]=useState<FormState>(initialForm)
  const [challenge,setChallenge]=useState<Challenge|null>(initialChallenge)
  const [mathAnswer,setMathAnswer]=useState('')
  const [state,setState]=useState<'idle'|'sending'|'sent'|'error'|'limited'|'math'>('idle')

  const copy=vi?{
    eyebrow:'KÊNH LIÊN HỆ',
    title:'Có việc cần trao đổi, hãy gửi đủ bối cảnh.',
    body:'Phù hợp cho dự án, hạ tầng, dữ liệu, vận hành hoặc một vấn đề kỹ thuật cần cùng nhìn rõ. Tin nhắn được lưu trước khi gửi thông báo cho tôi.',
    email:'EMAIL',
    github:'GITHUB',
    cv:'CV',
    cvValue:'Hồ sơ nghề nghiệp',
    response:'PHẢN HỒI',
    responseValue:'Khi có thể · không có SLA',
    form:'GỬI TIN NHẮN',
    name:'Tên',
    emailLabel:'Email',
    phone:'Điện thoại · tuỳ chọn',
    message:'Nội dung',
    math:'KIỂM TRA NHANH',
    mathHint:'Giải phép tính để xác nhận đây là người gửi.',
    mathError:'Kết quả chưa đúng. Tôi đã tạo một phép tính mới.',
    namePlaceholder:'Tên của bạn',
    emailPlaceholder:'you@example.com',
    phonePlaceholder:'+84 ...',
    messagePlaceholder:'Bối cảnh, vấn đề cần trao đổi và điều bạn mong muốn...',
    send:'Gửi tin nhắn',
    sending:'Đang gửi…',
    sent:'Đã nhận. Tin nhắn đã được lưu.',
    error:'Không gửi được lúc này. Bạn có thể dùng email bên trái.',
    limited:'Đã gửi quá nhiều lần. Vui lòng thử lại sau.',
  }:{
    eyebrow:'OPEN CHANNEL',
    title:'If there is something to discuss, send the context with it.',
    body:'Best for projects, infrastructure, data, operations, or a technical problem worth looking at together. Your message is stored before I am notified.',
    email:'EMAIL',
    github:'GITHUB',
    cv:'CV',
    cvValue:'Career record',
    response:'RESPONSE',
    responseValue:'As available · no SLA',
    form:'SEND A NOTE',
    name:'Name',
    emailLabel:'Email',
    phone:'Phone · optional',
    message:'Message',
    math:'QUICK CHECK',
    mathHint:'Solve the sum to confirm a human submission.',
    mathError:'That answer did not match. A new check has been issued.',
    namePlaceholder:'Your name',
    emailPlaceholder:'you@example.com',
    phonePlaceholder:'+84 ...',
    messagePlaceholder:'Context, what you are working on, and what you want to discuss...',
    send:'Send message',
    sending:'Sending…',
    sent:'Received. Your message has been stored.',
    error:'Could not send right now. You can use the email address on the left.',
    limited:'Too many messages from this connection. Please try again later.',
  }

  async function loadChallenge() {
    setChallenge(await requestChallenge())
  }

  function update(field:keyof FormState,value:string) {
    setForm(current=>({...current,[field]:value}))
    if (state!=='idle') setState('idle')
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    try {
      const response=await fetch('/api/contact',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          ...form,
          locale,
          challengeToken:challenge?.token ?? '',
          mathAnswer,
        }),
      })
      const payload=await response.json().catch(()=>null) as {code?:string}|null
      if (response.status===429) {
        setState('limited')
        return
      }
      if (!response.ok) {
        if (payload?.code==='math_invalid') {
          setState('math')
          setMathAnswer('')
          await loadChallenge()
          return
        }
        setState('error')
        return
      }
      setForm(initialForm)
      setMathAnswer('')
      await loadChallenge()
      setState('sent')
    } catch {
      setState('error')
    }
  }

  const status=state==='sent'
    ? copy.sent
    : state==='limited'
      ? copy.limited
      : state==='math'
        ? copy.mathError
        : state==='error'
          ? copy.error
          : null

  return (
    <section className="about-contact" aria-labelledby="about-contact-title">
      <div className="about-contact-intro">
        <span>{copy.eyebrow}</span>
        <h2 id="about-contact-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <div className="about-contact-routes">
          <a href="mailto:me@thaiduy.digital">
            <small>{copy.email}</small>
            <strong>me@thaiduy.digital</strong>
            <i>↗</i>
          </a>
          <a href="https://github.com/n8n2erpnext" target="_blank" rel="noreferrer">
            <small>{copy.github}</small>
            <strong>n8n2erpnext</strong>
            <i>↗</i>
          </a>
          <Link href="/cv">
            <small>{copy.cv}</small>
            <strong>{copy.cvValue}</strong>
            <i>↗</i>
          </Link>
          <div>
            <small>{copy.response}</small>
            <strong>{copy.responseValue}</strong>
          </div>
        </div>
      </div>

      <form className="about-contact-form" onSubmit={submit}>
        <div className="about-contact-form-head">
          <span>{copy.form}</span>
          <em>{state==='sending'?'TX…':'POST /api/contact'}</em>
        </div>
        <div className="about-contact-fields">
          <label>
            <span>{copy.name}</span>
            <input value={form.name} onChange={e=>update('name',e.target.value)} placeholder={copy.namePlaceholder} required maxLength={160} />
          </label>
          <label>
            <span>{copy.emailLabel}</span>
            <input type="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder={copy.emailPlaceholder} required maxLength={320} />
          </label>
          <label className="about-contact-wide">
            <span>{copy.phone}</span>
            <input value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder={copy.phonePlaceholder} maxLength={80} />
          </label>
          <label className="about-contact-wide">
            <span>{copy.message}</span>
            <textarea value={form.message} onChange={e=>update('message',e.target.value)} placeholder={copy.messagePlaceholder} required minLength={10} maxLength={5000} />
          </label>
          <div className="about-contact-math about-contact-wide">
            <div>
              <span>{copy.math}</span>
              <small>{copy.mathHint}</small>
            </div>
            <div className="about-contact-math-equation">
              <strong>{challenge ? challenge.a : '—'}</strong>
              <i>+</i>
              <strong>{challenge ? challenge.b : '—'}</strong>
              <i>=</i>
              <input
                aria-label={copy.math}
                inputMode="numeric"
                pattern="[0-9]*"
                value={mathAnswer}
                onChange={e=>setMathAnswer(e.target.value.replace(/\D/g,'').slice(0,3))}
                required
                disabled={!challenge}
              />
              <button type="button" className="about-contact-math-refresh" onClick={()=>void loadChallenge()} aria-label={vi?'Đổi phép tính':'New challenge'}>↻</button>
            </div>
          </div>
          <label className="about-contact-honeypot" aria-hidden="true">
            <span>Company</span>
            <input value={form.company} onChange={e=>update('company',e.target.value)} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="about-contact-submit">
          <button type="submit" disabled={state==='sending' || !challenge}>
            {state==='sending'?copy.sending:copy.send}
            <span>↗</span>
          </button>
          <p role="status" aria-live="polite" data-state={state}>{status}</p>
        </div>
      </form>
    </section>
  )
}

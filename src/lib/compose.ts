/**
 * Preview message composer. Builds drafts only from facts stored on the record
 * and the founder-approved SORTED positioning. The AI milestone replaces this
 * with a server-side call to Netlify AI Gateway using the same inputs.
 */
import type { Opportunity } from './types'

export const OUTPUT_TYPES = [
  'Cold business introduction email',
  'Short LinkedIn connection note',
  'Follow-up email',
  'Partnership introduction',
  'Referral request',
  'Co-founder networking introduction',
  'Brief phone call script',
  'Meeting follow-up',
] as const
export type OutputType = (typeof OUTPUT_TYPES)[number]

export const TONES = ['Professional', 'Friendly and straightforward', 'Founder-to-founder', 'Short and direct'] as const
export type Tone = (typeof TONES)[number]

const greeting = (o: Opportunity, tone: Tone) => {
  const first = o.contacts[0]?.name.split(' ')[0]
  if (!first) return tone === 'Professional' ? `Hello ${o.name} team,` : 'Hi there,'
  return tone === 'Professional' ? `Dear ${first},` : `Hi ${first},`
}

const hook = (o: Opportunity) => {
  const ev = o.assessment?.evidence[0]?.text
  if (ev) return `I was reading about ${o.name} and this caught my eye: ${ev}`
  return `I came across ${o.name} while looking at ${o.industry.toLowerCase()} businesses around ${o.city}.`
}

const problem = (o: Opportunity) => o.assessment?.problems[0]?.toLowerCase() ?? 'keeping stock levels and locations accurate'

const CTAS: Record<Tone, string[]> = {
  Professional: ['Would a short 15-minute call in the next couple of weeks be useful?', 'If it’s relevant, I’d be glad to share a short walkthrough at a time that suits you.'],
  'Friendly and straightforward': ['Worth a quick chat? Happy to work around your diary.', 'If it sounds useful I can show you in 15 minutes — no pressure either way.'],
  'Founder-to-founder': ['Would you be open to a quick founder-to-founder call? Even if it’s not a fit, I’d value your view.', 'Fancy a coffee or a 15-minute call? I’d genuinely like to hear how you run things.'],
  'Short and direct': ['Open to a 15-minute call?', 'Worth a quick look?'],
}

export function compose(o: Opportunity, type: OutputType, tone: Tone, variant: number, sorted: { oneLiner: string; founder: string }) {
  const g = greeting(o, tone)
  const cta = CTAS[tone][variant % CTAS[tone].length]
  const sign = `\n\nBest,\n${sorted.founder}\nFounder, SORTED · sorted.works`
  const optOut = '\n\nIf this isn’t relevant, just let me know and I won’t get in touch again.'
  const short = tone === 'Short and direct'

  switch (type) {
    case 'Short LinkedIn connection note':
      return `Hi${o.contacts[0] ? ' ' + o.contacts[0].name.split(' ')[0] : ''} — I’m building SORTED, ${sorted.oneLiner.toLowerCase()} I’ve been following ${o.industry.toLowerCase()} businesses in ${o.region} and would value connecting.`.slice(0, 300)
    case 'Brief phone call script':
      return `Opening: “Hi, it’s ${sorted.founder} from SORTED — have I caught you at an OK time for 30 seconds?”\n\nReason: “${hook(o)} I work with smaller warehouse teams on ${problem(o)}.”\n\nQuestion: “How are you handling that at the moment?”\n\nIf interested: “Would a 15-minute screen-share next week be useful?”\n\nIf not: “No problem at all — thanks for your time.” (Log outcome in Conneck.)`
    case 'Follow-up email':
      return `${g}\n\nJust following up on my note from last week about ${problem(o)}. I know things get busy${o.industry.includes('3PL') || o.industry.includes('fulfilment') ? ', especially heading into peak' : ''}.\n\n${cta}${optOut}${sign}`
    case 'Meeting follow-up':
      return `${g}\n\nThanks for your time today. As promised, here’s a short summary of what we covered and the next step we agreed.\n\n• Current challenge: ${problem(o)}\n• Next step: [add agreed next step]\n\nAny questions in the meantime, just reply here.${sign}`
    case 'Partnership introduction':
      return `${g}\n\n${hook(o)} I’m the founder of SORTED, ${sorted.oneLiner.toLowerCase()}\n\nOur customers overlap with yours, and I think there may be a simple way to help each other — whether that’s referrals or something more joined-up.\n\n${cta}${sign}`
    case 'Referral request':
      return `${g}\n\n${hook(o)} I’m building SORTED, ${sorted.oneLiner.toLowerCase()}\n\nYou probably speak to businesses dealing with ${problem(o)} more often than I do. If anyone comes to mind who might find it useful, I’d be very grateful for an introduction — and happy to return the favour.${optOut}${sign}`
    case 'Co-founder networking introduction':
      return `${g}\n\nI’m the founder of SORTED, ${sorted.oneLiner.toLowerCase()} It has early real-world usage and I’m now looking to meet experienced commercial people in the warehousing space.\n\nThis isn’t a job pitch — I’d simply value a conversation about how you see the market. ${CTAS['Founder-to-founder'][variant % 2]}${sign}`
    case 'Cold business introduction email':
    default:
      return short
        ? `${g}\n\n${hook(o)} SORTED helps smaller warehouse teams with ${problem(o)}.\n\n${cta}${optOut}${sign}`
        : `${g}\n\n${hook(o)}\n\nI’m the founder of SORTED, ${sorted.oneLiner.toLowerCase()} Teams like yours often tell me ${problem(o)} takes more time than it should, so I thought it might be worth a conversation.\n\n${cta}${optOut}${sign}`
  }
}

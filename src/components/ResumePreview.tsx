'use client';
import type { CSSProperties } from 'react';
import { ResumeData, sectionLabels } from '@/lib/resume';
import { getTemplate } from '@/lib/templates';
export default function ResumePreview({data,template,mini=false}:{data:ResumeData;template:string;mini?:boolean}){
 const t=getTemplate(template),p=data.personal;
 return <article className={`resume-paper ${t.font==='sans'?'paper-sans':''} ${mini?'mini-paper':''} template-${t.id}`} style={{'--paper-accent':t.accent,'--paper-margin':`${t.margin*6.5}%`} as CSSProperties}>
  <header className={`paper-header ${t.header==='left'?'left':''}`}><h1>{p.firstName||'Your'} {p.lastName||'Name'}</h1><div className="paper-role">{p.title||'Professional title'}</div><p>{[p.email,p.phone,p.location].filter(Boolean).join('  |  ')}</p><p>{[p.linkedin,p.github,p.website].filter(Boolean).join('  |  ')}</p></header>
  {[...new Set(data.sectionOrder)].map(key=>{if(key==='personal')return null;const value=data[key];if(!value?.length)return null;return <section className="paper-section" key={key}><h2>{sectionLabels[key]}</h2>{typeof value==='string'?<div className="paper-text">{value.split('\n').map((line,i)=><p key={i}>{key==='skills'&&line.includes(':')?<><strong>{line.split(':')[0]}:</strong>{line.slice(line.indexOf(':')+1)}</>:line}</p>)}</div>:value.map(entry=><div className="paper-entry" key={entry.id}><div className="paper-entry-title"><strong>{entry.title}</strong><span>{[entry.startDate,entry.endDate].filter(Boolean).join(' – ')}</span></div><div className="paper-entry-subtitle"><em>{entry.subtitle}</em><span>{entry.location}</span></div>{entry.technologies&&<p className="paper-tech">{entry.technologies}</p>}{entry.bullets.length>0&&<ul>{entry.bullets.filter(Boolean).map((b,i)=><li key={i}>{b}</li>)}</ul>}{entry.url&&<p className="paper-url">{entry.url}</p>}</div>)}</section>;})}
 </article>;
}

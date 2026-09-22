import { blankResume, emptyEntry, ResumeData, SectionKey } from '../resume';
export function braceGroups(source:string):string[] {const groups:string[]=[];let depth=0,start=0;for(let i=0;i<source.length;i++){if(source[i]==='\\'){i++;continue;}if(source[i]==='{'){if(depth++===0)start=i+1;}else if(source[i]==='}'&&depth>0&&--depth===0)groups.push(source.slice(start,i));}return groups;}
export function latexText(value:string):string {return value.replace(/(?<!\\)%[^\n]*/g,'').replace(/\\href\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,'$2 ($1)').replace(/\\(?:begin|end)\s*\{[^}]*\}(?:\[[^\]]*\])?/g,'').replace(/\\(?:vspace|hspace|setlength|fontsize)\*?(?:\[[^\]]*\])?\s*\{[^}]*\}/g,'').replace(/\\(?:textbf|textit|emph|underline|textsc|textrm|textnormal|mbox|url)\s*\{([^{}]*)\}/g,'$1').replace(/\\(?:item|resumeItem|cvitem|cvItem)\b(?:\[[^\]]*\])?/g,'\n• ').replace(/\\(?:hfill|quad|qquad|enspace|hspace)\b/g,' ').replace(/\\\\/g,'\n').replace(/\\[&#%_$]/g,s=>s.slice(1)).replace(/\\[a-zA-Z@]+\*?(?:\[[^\]]*\])?/g,'').replace(/[{}]/g,'').replace(/\$|~/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();}
const aliases:Record<string,SectionKey>={summary:'summary',profile:'summary',objective:'summary','professional summary':'summary',about:'summary',experience:'experience','work experience':'experience','professional experience':'experience',employment:'experience',education:'education',academics:'education',projects:'projects','personal projects':'projects','technical projects':'projects',skills:'skills','technical skills':'skills',technologies:'skills',certifications:'certifications',certificates:'certifications',awards:'achievements',achievements:'achievements',honors:'achievements'};
export type ImportResult={data:ResumeData;warnings:string[];originalTex:string;extractedText:string;confidence:Record<string,'high'|'review'>};
export function parseLatex(source:string):ImportResult {
 const data=blankResume(),warnings:string[]=[],confidence:Record<string,'high'|'review'>={};
 const clean=source.replace(/(?<!\\)%[^\n]*/g,'');
 const body=clean.includes('\\begin{document}')?clean.split('\\begin{document}')[1].split('\\end{document}')[0]:clean;
 const sections=[...body.matchAll(/\\(?:section|subsection|cvsection|resumeSection)\*?\s*\{([^}]+)\}/g)];
 const header=body.slice(0,sections[0]?.index??body.length),plain=latexText(header);
 const nameCommand=clean.match(/\\(?:name|fullname)\s*\{([^}]+)\}(?:\s*\{([^}]+)\})?/);
 const boldName=header.match(/\\(?:textbf|Huge|LARGE|huge)\s*\{?([^{}\\\n]+)\}?/);
 const name=nameCommand?[nameCommand[1],nameCommand[2]].filter(Boolean).join(' '):boldName?.[1]?.trim()||plain.split('\n').find(l=>/^[\p{L} .'-]{3,60}$/u.test(l.trim()))||'';
 const parts=name.trim().split(/\s+/); data.personal.firstName=parts.shift()||'';data.personal.lastName=parts.join(' ');confidence.name=nameCommand?'high':'review';
 data.personal.email=clean.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0]||'';
 data.personal.phone=plain.match(/(?:\+\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-])\d{3}[ .-]\d{4}/)?.[0]||'';
 const urls=[...clean.matchAll(/(?:https?:\/\/|www\.|linkedin\.com|github\.com)[^\s{}\\<>]+/g)].map(m=>m[0]);
 data.personal.linkedin=urls.find(x=>x.includes('linkedin.com'))||'';data.personal.github=urls.find(x=>x.includes('github.com'))||'';data.personal.website=urls.find(x=>!x.includes('linkedin.com')&&!x.includes('github.com'))||'';
 for(const key of ['email','phone','linkedin','github','website'] as const) confidence[key]=data.personal[key]?'high':'review';
 for(let i=0;i<sections.length;i++){
 const rawName=latexText(sections[i][1]),key=aliases[rawName.toLowerCase()]||'custom';
 const chunk=body.slice(sections[i].index!+sections[i][0].length,sections[i+1]?.index??body.length),text=latexText(chunk);
 if(key==='summary'||key==='skills'){data[key]+=(data[key]?'\n':'')+text;confidence[key]='high';continue;}
 if(key==='personal')continue;
 const entries=data[key];
 const macros=[...chunk.matchAll(/\\(resumeSubheading|resumeProjectHeading|cventry|cvevent|entry|customcventry)\b/g)];
 if(macros.length){for(let j=0;j<macros.length;j++){
 const segment=chunk.slice(macros[j].index!+macros[j][0].length,macros[j+1]?.index??chunk.length),groups=braceGroups(segment),entry=emptyEntry(),isCV=/cventry|cvevent/.test(macros[j][1]);
 entry.title=latexText(groups[isCV?1:0]||'');entry.subtitle=latexText(groups[isCV?2:2]||'');entry.location=latexText(groups[3]||'');
 const dates=latexText(groups[isCV?0:1]||'').split(/\s*(?:--+|–|—|\bto\b)\s*/);entry.startDate=dates[0]||'';entry.endDate=dates.slice(1).join(' – ');
 const bullets=[...segment.matchAll(/\\(?:resumeItem|cvItem)\s*\{/g)].map(m=>latexText(braceGroups(segment.slice(m.index!))[0]||''));
 entry.bullets=bullets.length?bullets:latexText(segment).split('•').slice(1).map(x=>x.trim()).filter(Boolean);
 if(isCV&&groups[5])entry.bullets.push(latexText(groups[5]));
 entry.url=urls.find(u=>segment.includes(u))||'';entries.push(entry);
 }}else if(text){
 const headings=[...chunk.matchAll(/(?:^|\n)\s*(?:\\noindent\s*)?\\textbf\s*\{/g)];
 if(headings.length){for(let j=0;j<headings.length;j++){
 const segment=chunk.slice(headings[j].index!,headings[j+1]?.index??chunk.length),entry=emptyEntry(),groups=braceGroups(segment);entry.title=latexText(groups[0]||rawName);
 const firstLine=segment.trimStart().split(/\\\\|\n/)[0];const dates=[...latexText(firstLine).matchAll(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?(?:19|20)\d{2}|Present|Current/gi)].map(m=>m[0]);entry.startDate=dates[0]||'';entry.endDate=dates[1]||'';
 const sub=segment.match(/\\(?:textit|emph)\s*\{/);if(sub){entry.subtitle=latexText(braceGroups(segment.slice(sub.index!))[0]||'');const line=segment.slice(sub.index!).split('\n')[0];entry.location=latexText(line.split('\\hfill')[1]||'');}
 entry.bullets=latexText(segment).split('•').slice(1).map(b=>b.trim()).filter(Boolean);entry.technologies=latexText(segment).match(/(?:Technologies|Tech stack|Tools)\s*:\s*([^\n]+)/i)?.[1]||'';entry.url=urls.find(u=>segment.includes(u))||'';
 if(!entry.bullets.length){const lines=latexText(segment).split('\n').filter(Boolean);entry.bullets=lines.slice(entry.subtitle?2:1).filter(l=>!l.includes(entry.url)||!entry.url);}
 entries.push(entry);
 }}else{const entry=emptyEntry();const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);entry.title=key==='custom'?rawName:(lines.shift()||rawName);entry.bullets=lines.map(l=>l.replace(/^•\s*/,''));entries.push(entry);}
 warnings.push(`${rawName}: verify the inferred title, dates, and bullet points.`);
}
 confidence[key]='review';
 }
 if(!sections.length)warnings.push('No standard section commands found. The full extracted text is preserved below; manually map it into your resume.');
 if(!name)warnings.push('We could not confidently identify your name.');
 warnings.push('Please verify contact details, dates, technologies, and section boundaries. Custom macros may require manual correction. Your original LaTeX is preserved unchanged.');
 return {data,warnings,originalTex:source,extractedText:latexText(body),confidence};
}

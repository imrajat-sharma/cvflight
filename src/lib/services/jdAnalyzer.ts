import { ResumeData } from '../resume';
const dictionary=['JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','React','Next.js','Vue','Angular','Node.js','Django','Flask','PostgreSQL','MySQL','MongoDB','Redis','SQL','AWS','Azure','GCP','Docker','Kubernetes','Git','CI/CD','GraphQL','REST','HTML','CSS','Tailwind CSS','Figma','Agile','Leadership','Communication','Testing','Accessibility','Machine learning','Data analysis'];
export function resumeText(data:ResumeData):string {return [Object.values(data.personal).join(' '),data.summary,data.skills,...['experience','education','projects','certifications','achievements','custom'].flatMap(k=>data[k as 'experience'].map(e=>[e.title,e.subtitle,e.technologies,...e.bullets].join(' ')))].join('\n');}
function contains(text:string,term:string){return new RegExp('(^|[^a-z0-9])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])','i').test(text);}
export type Suggestion={id:string;title:string;detail:string;replacement?:string;field?:'skills'|'summary';status?:'accepted'|'rejected'};
export function analyzeJD(jd:string,data:ResumeData){
 const keywords=dictionary.filter(k=>contains(jd,k)),text=resumeText(data),matched=keywords.filter(k=>contains(text,k)),missing=keywords.filter(k=>!contains(text,k));
 const responsibilities=jd.split(/[\n.!?]+/).map(s=>s.trim()).filter(s=>/\b(build|lead|design|develop|manage|collaborate|maintain|implement|responsib)\w*\b/i.test(s)).slice(0,6);
 const experience=jd.match(/\d+\+?\s*(?:-\s*\d+\s*)?years?(?:\s+of\s+experience)?/gi)||[];
 const existing=matched.filter(k=>!contains(data.skills,k));
 const suggestions:Suggestion[]=[];
 if(existing.length)suggestions.push({id:'existing-skills',title:'Surface skills you already use',detail:`${existing.join(', ')} appear in your resume but not your skills section. Make these existing strengths easier to find.`,field:'skills',replacement:data.skills+'\nAdditional demonstrated skills: '+existing.join(', ')});
 if(missing.length)suggestions.push({id:'missing',title:'Review the skill gaps',detail:`The job mentions ${missing.join(', ')}. These are not in your resume. Only add them yourself if you genuinely have this experience.`});
 if(matched.length)suggestions.push({id:'focus',title:'Lead with your relevant work',detail:`Your experience already demonstrates ${matched.slice(0,4).join(', ')}. Consider moving the most relevant experience or project higher using the section reorder controls.`});
 if(!keywords.length)suggestions.push({id:'no-keywords',title:'Add a more detailed description',detail:'No terms from the local technology dictionary were found. Include the full job description or use AI for a contextual review.'});
 return {score:keywords.length?Math.round(matched.length/keywords.length*100):0,keywords,matched,missing,responsibilities,experience,suggestions};
}

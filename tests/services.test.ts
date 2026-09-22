import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleResume,blankResume,resumeSchema } from '../src/lib/resume';
import { escapeLatex,renderLatex,safeUrl } from '../src/lib/services/latexRenderer';
import { parseLatex,braceGroups } from '../src/lib/services/latexParser';
import { analyzeJD } from '../src/lib/services/jdAnalyzer';
import { applySuggestion } from '../src/lib/services/optimizationService';
import { checkATS } from '../src/lib/services/atsService';
import { generatePDF } from '../src/lib/services/pdfService';
import { compileLatex,CompilerUnavailable } from '../src/lib/services/compileService';
import { templates } from '../src/lib/templates';

test('sample and blank data satisfy the common schema',()=>{assert.ok(resumeSchema.safeParse(sampleResume).success);assert.ok(resumeSchema.safeParse(blankResume()).success);});
test('LaTeX special characters cannot become user commands',()=>{assert.equal(escapeLatex('A&B_50%'),String.raw`A\&B\_50\%`);assert.equal(escapeLatex(String.raw`\input{/etc/passwd}`),String.raw`\textbackslash{}input\{/etc/passwd\}`);for(const c of ['#','$','{','}','~','^'])assert.ok(escapeLatex(c).startsWith('\\'));});
test('all six templates preserve input and render valid document scaffolding',()=>{const original=JSON.stringify(sampleResume);assert.equal(templates.length,6);const sources=templates.map(t=>renderLatex(sampleResume,t.id));assert.equal(new Set(sources).size,6);for(const source of sources){assert.ok(source.includes('\\begin{document}'));assert.ok(source.includes('Alex Morgan'));assert.ok(source.includes('\\end{document}'));assert.ok(!/\\(?:write18|input)\b/.test(source));}assert.equal(JSON.stringify(sampleResume),original);});
test('brace reader respects nested and escaped groups',()=>{assert.deepEqual(braceGroups(String.raw`{Hello {nested}}{A\{B\}}`),['Hello {nested}',String.raw`A\{B\}`]);});
test('LaTeX import detects contacts, custom commands and preserves original',()=>{const source=String.raw`\documentclass{article}
\name{Jamie}{Chen}
\begin{document}
\name{Jamie}{Chen}
jamie@example.com | +1 (415) 555-0100
\href{https://linkedin.com/in/jamie}{LinkedIn}
\section{Professional Summary}
Engineer building reliable systems.
\section{Experience}
\resumeSubheading{Software Engineer}{2020 -- Present}{Acme}{Remote}
\resumeItem{Built services with Python and PostgreSQL.}
\section{Technical Skills}
Python, PostgreSQL, Docker
\section{Awards}
\textbf{Engineering award}
\end{document}`;const result=parseLatex(source);assert.equal(result.originalTex,source);assert.equal(result.data.personal.firstName,'Jamie');assert.equal(result.data.personal.lastName,'Chen');assert.equal(result.data.personal.email,'jamie@example.com');assert.equal(result.data.experience[0].startDate,'2020');assert.equal(result.data.experience[0].endDate,'Present');assert.ok(result.data.experience[0].bullets[0].includes('Python'));assert.equal(result.data.achievements.length,1);assert.ok(result.warnings.length);assert.ok(resumeSchema.safeParse(result.data).success);});
test('ordinary bold headings and generated LaTeX split into separate entries',()=>{const result=parseLatex(renderLatex(sampleResume,'classic'));assert.equal(result.data.experience.length,2);assert.equal(result.data.experience[0].title,'Senior Software Engineer');assert.equal(result.data.experience[0].subtitle,'Linear');assert.equal(result.data.experience[0].startDate,'2022');assert.equal(result.data.experience[0].bullets.length,3);assert.equal(result.data.education[0].title,'B.S. in Computer Science');});
test('unknown LaTeX is preserved and flagged instead of silently discarded',()=>{const source=String.raw`\oddMacro{Legacy resume: Taylor, rust development, 2024}`;const result=parseLatex(source);assert.equal(result.originalTex,source);assert.ok(result.extractedText.includes('Legacy resume'));assert.ok(result.warnings.some(w=>w.includes('No standard section')));});
test('CV template date and role fields are extracted',()=>{const r=parseLatex(String.raw`\name{Sam}{Lee}\section{Experience}\cventry{2019--2023}{Developer}{Example Ltd}{London}{}{Built APIs}`);assert.equal(r.data.experience[0].title,'Developer');assert.equal(r.data.experience[0].startDate,'2019');assert.ok(r.data.experience[0].bullets.includes('Built APIs'));});
test('JD matching identifies gaps without inventing skills',()=>{const d=structuredClone(sampleResume);d.skills='TypeScript';const r=analyzeJD('Build React applications with TypeScript, Python and Kubernetes. 5+ years experience required.',d);assert.ok(r.matched.includes('React'));assert.ok(r.missing.includes('Kubernetes'));assert.ok(!r.missing.includes('Java'));assert.ok(r.experience.length);for(const suggestion of r.suggestions){const next=applySuggestion(d,suggestion);assert.ok(!next.skills.includes('Kubernetes'));assert.deepEqual(next.experience,d.experience);}assert.ok(r.suggestions.some(s=>s.field==='skills'));});
test('URL handling rejects unsupported schemes',()=>{assert.equal(safeUrl('github.com/alex'), 'https://github.com/alex');assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('https://example.com/?a=1&b=2'),'https://example.com/?a=1&b=2');});
test('ATS results distinguish heuristic, estimated and unchecked criteria',()=>{const report=checkATS(sampleResume);assert.ok(report.label.includes('not a real ATS'));assert.equal(report.checks.find(c=>c.name==='LaTeX compilation')?.pass,null);assert.equal(report.checks.find(c=>c.name==='Keyword coverage')?.pass,null);assert.ok(checkATS(blankResume()).score<report.score);});
test('structured export returns a real PDF and counts pages',async()=>{const result=await generatePDF(sampleResume,'classic');assert.equal(Buffer.from(result.bytes).subarray(0,5).toString(),'%PDF-');assert.ok(result.pages>=1);assert.ok(result.bytes.length>1000);});
test('all templates export readable PDFs',async()=>{for(const t of templates){const result=await generatePDF(sampleResume,t.id);assert.equal(Buffer.from(result.bytes).subarray(0,5).toString(),'%PDF-');}});
test('compiler fails closed unless explicitly configured',async()=>{const before=process.env.LATEX_COMPILER_ENABLED;process.env.LATEX_COMPILER_ENABLED='false';await assert.rejects(()=>compileLatex(String.raw`\immediate\write18{whoami}`),CompilerUnavailable);if(before!==undefined)process.env.LATEX_COMPILER_ENABLED=before;else delete process.env.LATEX_COMPILER_ENABLED;});

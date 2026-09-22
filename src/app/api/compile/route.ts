import { z } from 'zod';
import { resumeSchema } from '@/lib/resume';
import { readBody,apiError,ownerSession,rateLimit } from '@/lib/server';
import { compileLatex,CompilerUnavailable } from '@/lib/services/compileService';
import { generatePDF } from '@/lib/services/pdfService';
import { NextResponse } from 'next/server';
export const runtime='nodejs';
export async function POST(request:Request){try{rateLimit((await ownerSession())+':compile',10);const body=z.object({mode:z.enum(['structured','latex']),data:resumeSchema.optional(),template:z.string().default('classic'),tex:z.string().max(250000).optional()}).parse(await readBody(request));let bytes:Uint8Array,pages=0;if(body.mode==='latex'){if(!body.tex)throw new Error('LaTeX source is required.');bytes=await compileLatex(body.tex);}else{if(!body.data)throw new Error('Resume data is required.');const result=await generatePDF(body.data,body.template);bytes=result.bytes;pages=result.pages;}return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="resume.pdf"','Cache-Control':'no-store','X-PDF-Pages':String(pages),'X-PDF-Renderer':body.mode}});}catch(e){if(e instanceof CompilerUnavailable)return NextResponse.json({error:e.message,unavailable:true},{status:503});return apiError(e);}}

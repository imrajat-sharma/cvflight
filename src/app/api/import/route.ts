import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseLatex } from '@/lib/services/latexParser';
import { readBody,apiError,ownerSession,rateLimit } from '@/lib/server';
export async function POST(request:Request){try{rateLimit((await ownerSession())+':import',20);const {tex}=z.object({tex:z.string().min(10).max(250000)}).parse(await readBody(request));return NextResponse.json(parseLatex(tex));}catch(e){return apiError(e);}}

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { resumeSchema } from '@/lib/resume';
import { aiReview,providers } from '@/lib/services/aiService';
import { consumeManagedRequest } from '@/lib/services/billingService';
import { readBody,apiError,ownerSession,rateLimit } from '@/lib/server';
export async function POST(request:Request){try{const owner=await ownerSession();rateLimit(owner+':ai',6);const body=z.object({provider:z.enum(['mistral','openai','gemini','claude','grok']),key:z.string().max(500).default(''),model:z.string().max(100),data:resumeSchema,jd:z.string().max(30000),managed:z.boolean().default(false)}).parse(await readBody(request));let key=body.key,provider=body.provider,model=body.model;if(body.managed){await consumeManagedRequest(owner);key=process.env.MANAGED_AI_API_KEY!;provider=z.enum(['mistral','openai','gemini','claude','grok']).parse(process.env.MANAGED_AI_PROVIDER||'mistral');model=process.env.MANAGED_AI_MODEL||providers[provider].model;}else if(key.length<8)throw new Error('Enter a valid API key or activate a managed AI plan.');return NextResponse.json({suggestions:await aiReview(provider,key,model,body.data,body.jd)},{headers:{'Cache-Control':'no-store'}});}catch(e){return apiError(e);}}

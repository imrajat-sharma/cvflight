import Stripe from 'stripe';
import { createHash } from 'node:crypto';
import { eq, and, or, lt, ne, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
export const billingOwner=(owner:string)=>createHash('sha256').update(owner).digest('hex');
export function stripeClient(){if(!process.env.STRIPE_SECRET_KEY)throw new Error('Managed AI plans are not configured in this deployment. You can use your own API key instead.');return new Stripe(process.env.STRIPE_SECRET_KEY);}
export const billingAvailable=()=>Boolean(process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_PRICE_ID&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.APP_ORIGIN&&process.env.MANAGED_AI_API_KEY);
export async function getSubscription(owner:string){const [subscription]=await db.select().from(subscriptions).where(eq(subscriptions.owner,billingOwner(owner)));return subscription;}
export async function consumeManagedRequest(owner:string){if(!billingAvailable())throw new Error('Managed AI is not configured. Connect your own API key instead.');const bucket=new Date().toISOString().slice(0,7);const [sub]=await db.update(subscriptions).set({usage:sql`CASE WHEN ${subscriptions.usageMonth} = ${bucket} THEN ${subscriptions.usage} + 1 ELSE 1 END`,usageMonth:bucket}).where(and(eq(subscriptions.owner,billingOwner(owner)),inArray(subscriptions.status,['active','trialing']),or(ne(subscriptions.usageMonth,bucket),lt(subscriptions.usage,100)))).returning();if(!sub)throw new Error('An active Pro subscription with remaining requests is required (100 requests per calendar month).');}
export async function syncSubscription(subscription:Stripe.Subscription){const owner=subscription.metadata.workspace;if(!owner||!/^[a-f0-9]{64}$/.test(owner))return;const customer=typeof subscription.customer==='string'?subscription.customer:subscription.customer.id;await db.insert(subscriptions).values({owner,customerId:customer,subscriptionId:subscription.id,status:subscription.status}).onConflictDoUpdate({target:subscriptions.owner,set:{customerId:customer,subscriptionId:subscription.id,status:subscription.status,updatedAt:new Date()}});}

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db'; import { createToken } from '@/lib/auth'; import { loginSchema } from '@/lib/validation';
export async function POST(req:Request){
  const parsed=loginSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Enter a valid email and password.'},{status:422});
  const user=await db.user.findUnique({where:{email:parsed.data.email.toLowerCase()}});
  if(!user||user.status!=='ACTIVE'||!await bcrypt.compare(parsed.data.password,user.passwordHash))return NextResponse.json({error:'Email or password is incorrect.'},{status:401});
  const token=await createToken({id:user.id,name:user.name,email:user.email,role:user.role});
  const res=NextResponse.json({user:{id:user.id,name:user.name,role:user.role}}); res.cookies.set('forge_session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:28800,path:'/'}); return res;
}

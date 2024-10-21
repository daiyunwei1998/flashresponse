import AgentChat from '@/app/components/AgentChat'
import React from 'react'
import { cookies } from 'next/headers'

export default function page() {
  const cookieStore = cookies();
  
  const tenantId = cookieStore.get('tenantId')?.value;
  const userName = cookieStore.get('userName')?.value;
  const userId = cookieStore.get('userId')?.value;

  return (
    <div>
      <AgentChat tenantId ={tenantId} userName = {userName} userId = {userId} ></AgentChat>
    </div>
  )
}

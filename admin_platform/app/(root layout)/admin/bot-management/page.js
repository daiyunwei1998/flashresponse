import React from 'react'
import { cookies } from 'next/headers'
import BotManagement from '@/app/components/BotManagement'

export default function page() {
    const tenantId = cookies().get('tenantId')?.value
  return (
    <BotManagement tenantId = {tenantId}></BotManagement>
  )
}

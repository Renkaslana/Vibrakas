import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-nextauth"
import CreatePaymentClient from './CreatePaymentClient'

export default async function CreatePaymentPage() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user.role || "anggota"
  
  return <CreatePaymentClient userRole={userRole} />
}

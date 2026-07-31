import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getClients } from "@/app/actions/clients";
import { ClientsContent } from "./clients-content";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const clients = await getClients();

  return <ClientsContent clients={clients} />;
}

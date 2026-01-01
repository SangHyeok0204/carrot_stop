import { redirect } from 'next/navigation';

export default function AdminCampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/campaigns/${params.id}`);
}

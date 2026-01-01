import { redirect } from 'next/navigation';

export default function AdvertiserCampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/campaigns/${params.id}`);
}

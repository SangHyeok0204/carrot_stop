import { redirect } from 'next/navigation';

export default function InfluencerCampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/campaigns/${params.id}`);
}

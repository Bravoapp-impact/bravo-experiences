import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import AssociationPublicProfile from "@/components/association/AssociationPublicProfile";

export default function AssociationProfilePage() {
  const { profile, loading } = useAuth();

  if (loading || !profile?.association_id) {
    return (
      <AssociationLayout>
        <PageSkeleton variant="detail" />
      </AssociationLayout>
    );
  }

  return (
    <AssociationLayout>
      <AssociationPublicProfile
        associationId={profile.association_id}
        canEdit={true}
      />
    </AssociationLayout>
  );
}

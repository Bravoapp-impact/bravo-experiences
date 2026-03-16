import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/common/LoadingState";
import AssociationPublicProfile from "@/components/association/AssociationPublicProfile";

export default function AssociationProfilePage() {
  const { profile, loading } = useAuth();

  if (loading || !profile?.association_id) {
    return (
      <AssociationLayout>
        <LoadingState message="Caricamento profilo..." />
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

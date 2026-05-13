import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import {
  MapPin, Globe, Mail, Phone, User, Users, Pencil, Star,
  CheckCircle, Camera, X, Check, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { Link } from "react-router-dom";

interface AssociationPublicProfileProps {
  associationId: string;
  canEdit: boolean;
}

interface AssociationData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  partnership_start_date: string | null;
  status: string;
}

interface ReviewData {
  id: string;
  rating: number;
  feedback_positive: string | null;
  created_at: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
}

interface ExperienceData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  city: string | null;
  address: string | null;
  category: string | null;
  next_date: string | null;
  max_participants: number | null;
}

// --- Star Rating ---
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? "text-amber-500 fill-current" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// --- Inline Editable Field ---
function InlineEditField({
  value,
  fieldKey,
  editingField,
  editValue,
  onStartEdit,
  onChangeEdit,
  onSave,
  onCancel,
  canEdit,
  placeholder,
  icon: Icon,
  isTextarea = false,
  isLink = false,
}: {
  value: string | null;
  fieldKey: string;
  editingField: string | null;
  editValue: string;
  onStartEdit: (field: string, val: string) => void;
  onChangeEdit: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
  canEdit: boolean;
  placeholder: string;
  icon?: typeof MapPin;
  isTextarea?: boolean;
  isLink?: boolean;
}) {
  const isEditing = editingField === fieldKey;

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />}
          {isTextarea ? (
            <Textarea
              value={editValue}
              onChange={(e) => onChangeEdit(e.target.value)}
              rows={4}
              className="text-[13px]"
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => onChangeEdit(e.target.value)}
              className="text-[13px]"
              autoFocus
            />
          )}
        </div>
        <div className="flex gap-2 ml-6">
          <Button size="sm" variant="default" onClick={onSave} className="h-7 text-xs">
            <Check className="h-3 w-3 mr-1" /> Salva
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" /> Annulla
          </Button>
        </div>
      </div>
    );
  }

  if (!value && canEdit) {
    return (
      <button
        onClick={() => onStartEdit(fieldKey, "")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-[13px] transition-colors"
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="italic">+ {placeholder}</span>
      </button>
    );
  }

  if (!value) return null;

  return (
    <div className="flex items-start gap-2 group text-[13px]">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
          {value}
        </a>
      ) : isTextarea ? (
        <p className="text-foreground whitespace-pre-line">{value}</p>
      ) : (
        <span className="text-foreground">{value}</span>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onStartEdit(fieldKey, value)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024;

// === MAIN COMPONENT ===
export default function AssociationPublicProfile({ associationId, canEdit }: AssociationPublicProfileProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [association, setAssociation] = useState<AssociationData | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewData[]>([]);
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [referente, setReferente] = useState<{ first_name: string | null; last_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [associationId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAssociation(),
        fetchCities(),
        fetchExperiences(),
        fetchReviews(),
        fetchReferente(),
      ]);
    } catch (err) {
      devLog.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferente = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("association_id", associationId)
      .eq("role", "association_admin")
      .limit(1)
      .maybeSingle();
    if (error) {
      devLog.error("Error fetching referente:", error);
      return;
    }
    setReferente(data);
  };

  const fetchAssociation = async () => {
    const { data, error } = await supabase
      .from("associations")
      .select("*")
      .eq("id", associationId)
      .single();
    if (error) {
      devLog.error("Error fetching association:", error);
      return;
    }
    setAssociation(data as AssociationData);
  };

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from("association_cities")
      .select("city_id, cities(name)")
      .eq("association_id", associationId);
    if (error) {
      devLog.error("Error fetching cities:", error);
      return;
    }
    setCities(data?.map((c: any) => c.cities?.name).filter(Boolean) || []);
  };

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("experiences")
      .select("id, title, description, image_url, city, address, category, max_participants, experience_dates(id, start_datetime)")
      .eq("association_id", associationId)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) {
      devLog.error("Error fetching experiences:", error);
      return;
    }
    const mapped: ExperienceData[] = (data || []).map((e: any) => {
      const futureDates = (e.experience_dates || [])
        .filter((d: any) => new Date(d.start_datetime) > new Date())
        .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        image_url: e.image_url,
        city: e.city,
        address: e.address,
        category: e.category,
        next_date: futureDates[0]?.start_datetime || null,
        max_participants: e.max_participants,
      };
    });
    mapped.sort((a, b) => {
      if (a.next_date && !b.next_date) return -1;
      if (!a.next_date && b.next_date) return 1;
      if (a.next_date && b.next_date) return new Date(a.next_date).getTime() - new Date(b.next_date).getTime();
      return 0;
    });
    setExperiences(mapped);
  };

  const fetchReviews = async () => {
    const { data: exps } = await supabase
      .from("experiences")
      .select("id")
      .eq("association_id", associationId);
    if (!exps?.length) { setAllReviews([]); setReviews([]); return; }

    const expIds = exps.map((e) => e.id);
    const { data: dates } = await supabase
      .from("experience_dates")
      .select("id")
      .in("experience_id", expIds);
    if (!dates?.length) { setAllReviews([]); setReviews([]); return; }

    const dateIds = dates.map((d) => d.id);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, user_id, profiles:user_id(first_name, avatar_url)")
      .in("experience_date_id", dateIds);
    if (!bookings?.length) { setAllReviews([]); setReviews([]); return; }

    const bookingIds = bookings.map((b) => b.id);
    const { data: reviewsData } = await supabase
      .from("experience_reviews")
      .select("id, rating, feedback_positive, created_at, booking_id")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (!reviewsData?.length) { setAllReviews([]); setReviews([]); return; }

    const bookingMap = new Map(bookings.map((b: any) => [b.id, b]));
    const mapped: ReviewData[] = reviewsData.map((r: any) => {
      const booking = bookingMap.get(r.booking_id) as any;
      return {
        id: r.id,
        rating: r.rating,
        feedback_positive: r.feedback_positive,
        created_at: r.created_at,
        reviewer_name: booking?.profiles?.first_name || null,
        reviewer_avatar: booking?.profiles?.avatar_url || null,
      };
    });
    setAllReviews(mapped);
    setReviews(mapped.slice(0, 6));
  };

  // --- Inline edit handlers ---
  const startEdit = (field: string, val: string) => {
    setEditingField(field);
    setEditValue(val);
  };
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };
  const saveField = async () => {
    if (!editingField || !association) return;
    setSavingField(true);
    try {
      const { error } = await supabase
        .from("associations")
        .update({ [editingField]: editValue || null })
        .eq("id", associationId);
      if (error) throw error;
      setAssociation({ ...association, [editingField]: editValue || null });
      toast({ title: "Salvato", description: "Informazione aggiornata con successo." });
      setEditingField(null);
    } catch (err) {
      devLog.error("Error saving field:", err);
      toast({ title: "Errore", description: "Impossibile salvare.", variant: "destructive" });
    } finally {
      setSavingField(false);
    }
  };

  // --- Direct logo upload (no LogoUpload component) ---
  const handleLogoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !association) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: "Formato non valido", description: "PNG, JPG, WebP, SVG" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ variant: "destructive", title: "File troppo grande", description: "Max 2 MB" });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${associationId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("association-logos")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("association-logos").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from("associations")
        .update({ logo_url: publicUrl })
        .eq("id", associationId);
      if (dbError) throw dbError;

      setAssociation({ ...association, logo_url: publicUrl });
      toast({ title: "Logo aggiornato" });
    } catch (err) {
      devLog.error("Error uploading logo:", err);
      toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare il logo" });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // --- Stats ---
  const reviewCount = allReviews.length;
  const avgRating = reviewCount > 0
    ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : 0;

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-10 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-6">
              <Skeleton className="h-10 w-14" />
              <Skeleton className="h-10 w-14" />
              <Skeleton className="h-10 w-14" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!association) return null;

  const displayedReviews = showAllReviews ? allReviews : reviews;

  return (
    <div className="max-w-5xl space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
        {/* Left — Profile Card (sticky across full page) */}
        <div>
          <Card className="h-fit">
            <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
              {/* Logo with direct upload */}
              <div className="relative group">
                {association.logo_url ? (
                  <img
                    src={association.logo_url}
                    alt={association.name}
                    className="h-24 w-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {association.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {canEdit && (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    disabled={uploadingLogo}
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </button>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  className="hidden"
                  onChange={handleLogoFileSelect}
                  disabled={uploadingLogo}
                />
              </div>

              {/* Name */}
              <h2 className="text-xl font-bold text-foreground leading-tight">{association.name}</h2>

              {/* Stats row */}
              <div className="flex items-center justify-center gap-4 w-full">
                <div className="text-center min-w-0">
                  <p className="text-base font-bold text-foreground leading-tight">{reviewCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Recensioni</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center min-w-0">
                  <p className="text-base font-bold text-foreground leading-tight">
                    {avgRating > 0 ? avgRating : "–"}
                    {avgRating > 0 && <Star className="inline h-3 w-3 text-amber-500 fill-current ml-0.5 -mt-0.5" />}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Valutazione</p>
                </div>
              </div>

              {/* Verified badge — compact */}
              <div className="flex items-center gap-1 text-[12px] text-green-700">
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="font-medium">Identità verificata</span>
              </div>
            </CardContent>
          </Card>

          {/* Referente card */}
          {referente && (
            <Card className="mt-4">
              <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
                <Avatar className="h-16 w-16">
                  {referente.avatar_url ? (
                    <AvatarImage src={referente.avatar_url} alt={`${referente.first_name} ${referente.last_name}`} />
                  ) : null}
                  <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
                    {(referente.first_name?.charAt(0) || "").toUpperCase()}
                    {(referente.last_name?.charAt(0) || "").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {referente.first_name} {referente.last_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Referente</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Info section */}
        <div className="space-y-5">
          {/* Info section */}
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">
              Informazioni su {association.name}
            </h2>

            <InlineEditField
              value={association.description}
              fieldKey="description"
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onChangeEdit={setEditValue}
              onSave={saveField}
              onCancel={cancelEdit}
              canEdit={canEdit}
              placeholder="Aggiungi descrizione"
              isTextarea
            />

            <Separator />

            <div className="space-y-3">
              <InlineEditField value={association.address} fieldKey="address" editingField={editingField} editValue={editValue} onStartEdit={startEdit} onChangeEdit={setEditValue} onSave={saveField} onCancel={cancelEdit} canEdit={canEdit} placeholder="Aggiungi indirizzo" icon={MapPin} />
              <InlineEditField value={association.website} fieldKey="website" editingField={editingField} editValue={editValue} onStartEdit={startEdit} onChangeEdit={setEditValue} onSave={saveField} onCancel={cancelEdit} canEdit={canEdit} placeholder="Aggiungi sito web" icon={Globe} isLink />
              <InlineEditField value={association.contact_email} fieldKey="contact_email" editingField={editingField} editValue={editValue} onStartEdit={startEdit} onChangeEdit={setEditValue} onSave={saveField} onCancel={cancelEdit} canEdit={canEdit} placeholder="Aggiungi email" icon={Mail} />
              <InlineEditField value={association.contact_phone} fieldKey="contact_phone" editingField={editingField} editValue={editValue} onStartEdit={startEdit} onChangeEdit={setEditValue} onSave={saveField} onCancel={cancelEdit} canEdit={canEdit} placeholder="Aggiungi telefono" icon={Phone} />
              <InlineEditField value={association.contact_name} fieldKey="contact_name" editingField={editingField} editValue={editValue} onStartEdit={startEdit} onChangeEdit={setEditValue} onSave={saveField} onCancel={cancelEdit} canEdit={canEdit} placeholder="Aggiungi nome referente" icon={User} />
            </div>

            {cities.length > 0 && (
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-muted-foreground">Città operative</p>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map((city) => (
                    <Badge key={city} variant="secondary" className="text-[11px]">
                      <MapPin className="h-3 w-3 mr-1" />
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* === SECTION 2: REVIEWS (full width) === */}
      <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">
              Recensioni su {association.name}{reviewCount > 0 ? ` (${reviewCount})` : ""}
            </h2>

            {reviewCount === 0 ? (
              <p className="text-[13px] text-muted-foreground">Ancora nessuna recensione</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
                  {displayedReviews.map((review) => (
                    <div
                      key={review.id}
                      className="py-5 border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        {review.reviewer_avatar ? (
                          <img src={review.reviewer_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                            {review.reviewer_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <p className="text-[13px] font-semibold text-foreground leading-tight">
                            {review.reviewer_name || "Utente"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} />
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: it })}
                        </span>
                      </div>
                      {review.feedback_positive && (
                        <p className="text-[13px] text-foreground line-clamp-3 leading-relaxed">
                          {review.feedback_positive}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {allReviews.length > 6 && !showAllReviews && (
                  <Button
                    variant="outline"
                    className="font-semibold border-foreground text-foreground hover:bg-muted"
                    onClick={() => { setShowAllReviews(true); setReviews(allReviews); }}
                  >
                    Mostra tutte le {allReviews.length} recensioni
                  </Button>
                )}
              </>
            )}
          </div>

      <Separator />

      {/* === SECTION 3: EXPERIENCES (full width) === */}
      <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">
              Esperienze di {association.name}{experiences.length > 0 ? ` (${experiences.length})` : ""}
            </h2>

            {experiences.length === 0 ? (
              <div className="text-[13px] text-muted-foreground">
                <p>Nessuna esperienza pubblicata ancora</p>
                {canEdit && (
                  <Link to="/association/experiences" className="inline-flex items-center gap-1 text-primary hover:underline mt-2">
                    Crea la tua prima esperienza <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="group">
                    <BaseCardImage
                      imageUrl={exp.image_url}
                      alt={exp.title}
                      aspectRatio="square"
                      fallbackEmoji="🌿"
                    />
                    <div className="pt-2 space-y-1">
                      <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug">
                        {exp.title}
                      </h3>
                      {exp.city && (
                        <p className="text-[11px] text-muted-foreground font-light flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{exp.city}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
                        {exp.next_date && (
                          <span>
                            {format(new Date(exp.next_date), "d MMM", { locale: it })}
                          </span>
                        )}
                        {exp.max_participants && (
                          <>
                            {exp.next_date && <span className="text-border">·</span>}
                            <span className="flex items-center gap-0.5">
                              <Users className="h-2.5 w-2.5" />
                              {exp.max_participants}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  );
}

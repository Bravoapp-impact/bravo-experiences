import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function EnrollMFA() {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.totp ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const verifiedFactors = factors.filter((f) => f.status === "verified");
  const hasMFA = verifiedFactors.length > 0;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Bravo! Authenticator",
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile avviare la configurazione MFA",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast({ title: "MFA attivato!", description: "L'autenticazione a due fattori è ora attiva." });
      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      await fetchFactors();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Codice non valido",
        description: error.message || "Verifica il codice e riprova.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenroll = async (fId: string) => {
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: fId });
      if (error) throw error;
      toast({ title: "MFA disattivato", description: "L'autenticazione a due fattori è stata rimossa." });
      await fetchFactors();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile disattivare MFA",
      });
    } finally {
      setUnenrolling(false);
    }
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <section className="flex items-center py-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Autenticazione a due fattori</h3>
        <p className="text-sm text-muted-foreground">
          Proteggi il tuo account con l'autenticazione a due fattori (2FA)
        </p>
      </div>
      <div className="space-y-4">
        {hasMFA && !qrCode && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="font-medium text-success">
                Autenticazione a due fattori attiva
              </span>
            </div>
            {verifiedFactors.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  {f.friendly_name || "Authenticator App"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnenroll(f.id)}
                  disabled={unenrolling}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {unenrolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3 mr-1" />}
                  Disattiva
                </Button>
              </div>
            ))}
          </div>
        )}

        {!hasMFA && !qrCode && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Autenticazione a due fattori non attiva
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Usa un'app come Google Authenticator o Authy per generare codici di accesso temporanei.
            </p>
            <div className="flex justify-start">
              <Button onClick={handleEnroll} disabled={enrolling} size="sm">
                {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Shield className="h-3.5 w-3.5 mr-2" />}
                Attiva 2FA
              </Button>
            </div>
          </div>
        )}

        {qrCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                1. Scansiona il QR code con la tua app authenticator
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  Oppure inserisci manualmente questo codice:
                </p>
                <button
                  onClick={handleCopySecret}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-muted text-xs font-mono tracking-wider hover:bg-muted/80 transition-colors"
                >
                  {secret}
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                2. Inserisci il codice a 6 cifre generato dall'app
              </p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setQrCode(null);
                  setSecret(null);
                  setFactorId(null);
                  setVerifyCode("");
                }}
              >
                Annulla
              </Button>
              <Button
                className="flex-1"
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || verifying}
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verifica e attiva
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

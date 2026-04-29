/**
 * Default values for the TB quote editor.
 * TODO: Filippo affinerà i termini contrattuali standard.
 */

export const QUOTE_DEFAULT_VALIDITY_DAYS = 30;

export const TERMS_DEFAULT_TB = `Termini e condizioni del preventivo:

1. Validità: il presente preventivo è valido 30 giorni dalla data di emissione.
2. Pagamento: a 30 giorni data fattura, tramite bonifico bancario.
3. Variazioni partecipanti: eventuali variazioni del numero di partecipanti dovranno essere comunicate per iscritto almeno 7 giorni prima della data dell'evento. Variazioni successive potrebbero comportare addebiti.
4. Annullamento: in caso di disdetta entro 14 giorni dall'evento, sarà trattenuto il 50% dell'importo a titolo di penale; entro 7 giorni, il 100%.
5. Logistica e materiali: salvo diversa indicazione, i costi di trasferta, location e materiali sono inclusi nelle voci di preventivo.
6. Privacy e immagini: l'azienda cliente garantisce di aver acquisito le necessarie liberatorie dai partecipanti per eventuali riprese fotografiche e video.
7. Foro competente: per qualsiasi controversia è competente il Foro di Milano.

L'accettazione del preventivo implica l'integrale accettazione dei presenti termini.`;

export function getDefaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + QUOTE_DEFAULT_VALIDITY_DAYS);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

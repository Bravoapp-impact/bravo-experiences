## Piano: Vista dettaglio format per HR + immagini di prova

### Obiettivo

L'HR deve poter aprire il dettaglio di un singolo format proposto in una pagina dedicata (stesso layout della pagina super-admin `/super-admin/team-building/formats/:id`), nascondendo le informazioni riservate (associazioni erogatrici, prezzi). Da lì può marcare il format come "Mi interessa" o "Non interessato". Inoltre popoliamo i 70 format esistenti con immagini placeholder.

---

### Modifica 1 — Nuova route HR per il dettaglio proposta

Aggiungere route in `src/App.tsx`:

```
/hr/team-building/:requestId/proposte/:proposalId  →  HRTBProposalDetailPage
```

### Modifica 2 — Nuova pagina `HRTBProposalDetailPage`

File: `src/pages/hr/HRTBProposalDetailPage.tsx`

Struttura visiva clonata da `TBFormatDetailPage` ma adattata all'HR:
- **Layout**: `HRLayout` invece di `SuperAdminLayout`
- **Hero split**: immagine (55%) + titolo, badge categoria, badge location, partecipanti, durata
- **Cosa farete**: descrizione completa
- **Tag secondari**: visibili
- **SDG**: visibili
- **Servizi inclusi**: visibili
- **Sidebar destra (sticky)** con due CTA invece di Modifica/Elimina:
  - `Mi interessa` / `Interessato ✓` (toggle, stesso comportamento del card)
  - `Non interessato` (variant outline / ghost)
  - In fondo: link "Torna alle proposte"

**Informazioni NASCOSTE all'HR:**
- Range prezzo (€80–€80 / persona)
- Lista associazioni erogatrici
- Città disponibili (in questa fase del flusso non rilevanti — HR ha già indicato i suoi luoghi nel brief)
- Status del format (draft/published/archived) e date di creazione
- Servizi extra (sono leve di pricing per le quotazioni)

**Data fetching**: usa la stessa RPC `get_tb_proposal_details(p_request_id)` già in uso, filtrando per `proposal_id` dal URL. Nessuna modifica DB necessaria — la RPC già esclude prezzi e associazioni.

### Modifica 3 — Card cliccabili in `HRTBRequestDetailPage`

Nel file `src/pages/hr/HRTBRequestDetailPage.tsx`:
- Rimuovere il `Dialog` di anteprima (righe 278–335) e lo state `detailProposal`
- Cambiare il click sul `ProposalCard` perché navighi a `/hr/team-building/:id/proposte/:proposalId` invece di aprire il modal
- Mantenere intatti i pulsanti "Mi interessa" / "Non interessato" sulla card della lista (azione rapida senza aprire dettaglio)

### Modifica 4 — Immagini placeholder per i 70 format

Migration SQL: aggiornare `tb_formats.image_url` per i record con `image_url IS NULL`, assegnando un'immagine Unsplash coerente con la categoria. Strategia:

```sql
UPDATE tb_formats f
SET image_url = CASE c.name
  WHEN 'Natura e ambiente' THEN 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200'
  WHEN 'Cucina e cibo'     THEN 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200'
  WHEN 'Arte e creatività' THEN 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200'
  WHEN 'Sport e movimento' THEN 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200'
  WHEN 'Workshop e formazione' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200'
  WHEN 'Solidarietà'       THEN 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200'
  ELSE 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200'
END
FROM categories c
WHERE f.category_id = c.id AND f.image_url IS NULL;
```

(I nomi esatti delle categorie verranno verificati prima di scrivere la migration; gli URL sono stabili Unsplash.)

---

### File toccati

| File | Tipo |
|---|---|
| `src/App.tsx` | Nuova route HR |
| `src/pages/hr/HRTBProposalDetailPage.tsx` | Nuovo |
| `src/pages/hr/HRTBRequestDetailPage.tsx` | Rimozione modal, navigate al detail |
| `supabase/migrations/...sql` | UPDATE `tb_formats.image_url` per i record nulli |

### Note

- La RPC `get_tb_proposal_details` esiste già, restituisce solo dati del format senza prezzi né associazioni — perfetta per HR.
- Nessuna modifica RLS necessaria (HR continua a NON poter leggere `tb_formats` direttamente).
- Le immagini placeholder restano modificabili dal super-admin via `TBFormatEditDialog`.

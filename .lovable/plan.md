

# Piano: Fix scroll + Card referente

## 1. Rimuovere sticky dalla card profilo
Nella riga 438, rimuovere `lg:self-start lg:sticky lg:top-6` — la card scorre normalmente con la pagina.

## 2. Aggiungere card referente
Dato che il referente è sempre l'association_admin loggato, aggiungo:

- **Fetch**: query `profiles` con `association_id = associationId` e `role = 'association_admin'` per ottenere `first_name`, `last_name`, `avatar_url`
- **Card referente**: posizionata sotto la card profilo (nella colonna sinistra), stile Airbnb "Il tuo host":
  - Avatar circolare del referente (foto dal profilo, o iniziali come fallback)
  - Nome e cognome
  - Label "Referente" sotto il nome
  - Se canEdit, il nome referente resta comunque non editabile qui (viene dal profilo utente)

## File modificato
`src/components/association/AssociationPublicProfile.tsx`


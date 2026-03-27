

# Piano: Dipendenti vedono solo esperienze attivate dall'HR

## Problema

La funzione SQL `can_employee_see_experience` attualmente permette ai dipendenti di vedere un'esperienza se:
1. È assegnata direttamente via `experience_companies` (Check 1)
2. **OPPURE** è pubblica e l'azienda ha il `service_type` abilitato in `company_service_config` (Check 3)

Il Check 3 è troppo permissivo: mostra TUTTE le esperienze pubbliche del tipo abilitato, ignorando la curation fatta dall'HR.

## Soluzione

Modificare la funzione `can_employee_see_experience` rimuovendo il Check 3 (fallback su `company_service_config`). I dipendenti vedranno solo le esperienze che il loro HR ha esplicitamente aggiunto al programma via `experience_companies`.

## Modifica

Una sola migration SQL che fa `CREATE OR REPLACE FUNCTION public.can_employee_see_experience` mantenendo solo il check su `experience_companies` e rimuovendo il blocco che interroga `company_service_config`.

La policy RLS dell'HR (`HR admin can view published public experiences v2`) resta invariata — l'HR continua a vedere tutto il catalogo per poter scegliere cosa attivare.

Nessuna modifica al codice frontend.

## File coinvolti

| File | Modifica |
|------|----------|
| Migration SQL | `CREATE OR REPLACE FUNCTION can_employee_see_experience` senza Check 3 |

1 migration, 0 file frontend.


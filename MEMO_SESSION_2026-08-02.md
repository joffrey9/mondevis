# MEMO SESSION — 2026-08-02 (MonDevis : état des lieux + plan Resend demain)

> **Statut global** : ✅ Landing page refaite et commitée (`17a8aac`, 15:53). ✅ Peppol fonctionnel (clé par artisan) — **NE PLUS TOUCHER**. ⏸ Stripe = à faire **juste avant la vente** (le pricing pointe déjà vers `/auth/signin`, pas de checkout encore). 🔜 Resend = planifié **demain matin si < 45 min** (sinon on arrête et on reprend plus tard).

---

## 1. ✅ Décisions du jour (2026-08-02)

| Sujet | Décision | Statut |
|---|---|---|
| **Peppol** (clé API par artisan + fallback global) | ✅ Fonctionnel — **ne plus y toucher** | Verrouillé |
| **Landing page** (navbar, hero, how-it-works, stats, features, témoignages, pricing, FAQ) | ✅ Commitée `17a8aac` 15:53 | Fait |
| **OVH + Resend** | 🔜 Demain matin, **seulement si < 45 min** | En attente |
| **Stripe** (checkout + webhook + abonnement) | 🔜 Juste avant la vente | Plus tard |
| **2e domaine Resend** (`mondedevis.eu`) | ❌ **Impossible en gratuit** (Free = 1 domaine) | Écarté |

---

## 2. 🔍 Vérifications DNS faites le 02/08 (résultats réels)

### 2.1. `devisflash.net` — registrar **Cloudflare** (PAS OVH)

Le DNS est **déjà configuré pour Resend** :

| Record | Valeur trouvée | Statut |
|---|---|---|
| SPF (TXT `@`) | `v=spf1 include:_spf.resend.com ~all` | ✅ |
| DKIM (TXT `send._domainkey`) | clé RSA publique présente | ✅ |
| DMARC (TXT `_dmarc`) | `v=DMARC1; p=quarantine; rua=mailto:dmarc@devisflach.net` | ✅ (typo `devisflach` cosmétique) |
| MX | vide (normal pour un domaine d'envoi transactionnel) | ✅ |

→ **`devisflash.net` est très probablement DÉJÀ `Verified` sur Resend** (ou vérifiable en 2 min car les records sont posés).

### 2.2. `mondedevis.eu` — registrar **OVH** (ns106.ovh.net)

| Record | Valeur trouvée | Statut |
|---|---|---|
| SPF (TXT `@`) | `v=spf1 include:amazonses.com ~all` (ancien, reste AWS SES) | ⚠️ |
| DKIM Resend | absent | ❌ |
| MX | vide | ❌ |

→ **NON configuré pour Resend.** Et de toute façon : **inutile de le configurer** car le plan Free Resend = 1 seul domaine, et on garde `devisflash.net`.

---

## 3. 🎯 STRATÉGIE RETENUE (option 1 — gratuite)

**MonDevis envoie déjà ses emails via `noreply@devisflash.net`** (constaté dans `.env.local` : `EMAIL_FROM=noreply@devisflash.net`, `AUTH_RESEND_FROM=noreply@devisflash.net`).

→ Il suffit de **confirmer que `devisflash.net` est `Verified` sur Resend** et de **lancer un test d'envoi réel**. Aucun DNS à modifier chez OVH, aucun record à ajouter.

> 💡 Rappel Resend (vérifié doc officielle 02/08/2026) :
> - Plan **Free** = **1 domaine** vérifié, 100 emails/jour, 3000/mois
> - Plan **Pro** = 10 domaines, 20 $/mois
> - Les **sous-domaines comptent comme des domaines séparés** (doivent être vérifiés individuellement)
> - Aucune astuce officielle pour 2 domaines racine en gratuit

---

## 4. 🔜 PLAN POUR DEMAIN MATIN (budget total ≤ 45 min)

### Étape 1 — Vérifier le domaine sur Resend (5 min) 🔍

1. Ouvre https://resend.com/domains
2. Cherche `devisflash.net` :
   - **Si statut = `Verified`** ✅ → passe à l'Étape 2
   - **Si absent** → bouton **Add Domain** → tape `devisflash.net` → Save → status `Pending` → clique **Verify** (les records DNS sont déjà posés, donc ça passe en quelques minutes)
   - **Si `Pending`/`Failed`** → vérifie les records avec :
     ```bash
     dig +short TXT devisflash.net          # doit contenir include:_spf.resend.com
     dig +short TXT send._domainkey.devisflash.net   # doit contenir p=...
     dig +short TXT _dmarc.devisflash.net   # doit contenir v=DMARC1
     ```

### Étape 2 — Lancer le test d'envoi réel (10 min) 🚀

Dans le terminal, depuis `~/Desktop/MonDevis` :

```bash
cd ~/Desktop/MonDevis
npx tsx scripts/test-email-send.ts "ton@email.com"
```

**Ce que fait le script** : charge le dernier devis + la dernière facture en base, génère les 2 vrais PDF, construit le payload Resend exact (comme l'app), et envoie avec PDF joints depuis `noreply@devisflash.net`.

**Critère de succès** :
- Sortie : `✓ ENVOYÉ avec succès à ...`
- L'email arrive dans ta boîte (pas en spam)
- `From: noreply@devisflash.net` (PAS `onboarding@resend.dev`)
- Gmail → `Show original` → `dkim=pass spf=pass dmarc=pass`

### Étape 3 — Si l'envoi échoue (diagnostic rapide, 15 min) 🆘

| Erreur | Cause probable | Fix |
|---|---|---|
| `403` / "domain not verified" | `devisflash.net` pas encore `Verified` sur Resend | Étape 1 → Add Domain → Verify |
| `from` invalide | `EMAIL_FROM` pointe vers un domaine non vérifié | Remplacer par `noreply@devisflash.net` |
| `dkim=fail` côté Gmail | clé DKIM pas propagée / TTL | Re-check `dig` Étape 1 |
| Email en **spam** | volume faible = normal au début | Ouvrir Gmail → "Pas du spam" + ajouter à contacts |

### Étape 4 — Décision GO / STOP (5 min) ⏱️

- **Si tout passe** ✅ → l'email est opérationnel. On note, et on ferme le dossier Resend.
- **Si > 45 min écoulées** → **STOP** (comme convenu). On reprend plus tard, sans rien casser.

---

## 5. 📌 Ce qu'il NE FAUT PAS toucher demain

- ❌ **Peppol** : ne pas modifier (fonctionnel, verrouillé)
- ❌ **`mondedevis.eu`** : ne pas ajouter chez Resend (2e domaine = payant, inutile)
- ❌ **Stripe** : ne pas implémenter (seulement juste avant la vente)
- ❌ **`.env.local`** : secrets — ne pas committer, ne pas modifier sans besoin

---

## 6. 🔗 Références utiles

| Ressource | Chemin | Usage |
|---|---|---|
| Script de test email | `~/Desktop/MonDevis/scripts/test-email-send.ts` | Test envoi réel avec PDF |
| Config emails | `~/Desktop/MonDevis/src/auth.ts` | Magic Link Resend (NextAuth) |
| Envoi devis/factures | `~/Desktop/MonDevis/src/app/actions/devis-envoi.ts`, `facture-envoi.ts` | Payload Resend exact |
| Env vars | `~/Desktop/MonDevis/.env.local` | `EMAIL_FROM`, `AUTH_RESEND_FROM`, clés |
| Doc Resend (domaines) | https://resend.com/docs/dashboard/domains/introduction | Politique officielle (Free = 1 domaine) |
| Doc setup DevisFlash (réf.) | `~/Desktop/dossier Freebuff/devis-generator/SETUP-RESEND-DOMAIN.md` | Contexte similaire déjà documenté (Strat D §8) |

---

## 7. 🎯 Bilan

**Session 02/08 close-able** : landing ✅, Peppol verrouillé ✅, stratégie email = `devisflash.net` (gratuit, DNS déjà en place) ✅.

**Demain matin** : Étape 1 (5 min) → Étape 2 (10 min) → si tout vert, dossier Resend fermé. Budget total ≈ 15-20 min, largement sous les 45 min.

*Memo close-out v1. Rédigé le 02/08/2026 en fin de session. À relire demain matin avant d'ouvrir Resend.*

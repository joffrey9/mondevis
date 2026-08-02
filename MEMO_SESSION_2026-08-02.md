# MEMO SESSION — 2026-08-02 (MonDevis : état des lieux + plan Resend demain)

> **Statut global** : ✅ Landing page refaite et commitée (`17a8aac`, 15:53). ✅ Peppol fonctionnel (clé par artisan) — **NE PLUS TOUCHER**. ⏸ **DevisFlash = SUSPENDU** (aucun retour pour le moment) → on bascule sur **`mondedevis.eu`**. ⏸ Stripe = à faire **juste avant la vente**. 🔜 Resend/OVH = planifié **demain matin si < 45 min** (sinon on arrête et on reprend plus tard).

---

## 1. ✅ Décisions du jour (2026-08-02)

| Sujet | Décision | Statut |
|---|---|---|
| **Peppol** (clé API par artisan + fallback global) | ✅ Fonctionnel — **ne plus y toucher** | Verrouillé |
| **Landing page** (navbar, hero, how-it-works, stats, features, témoignages, pricing, FAQ) | ✅ Commitée `17a8aac` 15:53 | Fait |
| **DevisFlash** | ⏸ **SUSPENDU** — aucun retour pour le moment. Ne pas y investir. Comptes IG/Facebook à refaire plus tard | En pause |
| **Domaine d'envoi** | 🔄 **Bascule sur `mondedevis.eu`** (OVH) — c'est le produit qu'on vend | Demain |
| **OVH + Resend** | 🔜 Demain matin, **seulement si < 45 min** | En attente |
| **Stripe** (checkout + webhook + abonnement) | 🔜 Juste avant la vente | Plus tard |

---

## 2. 🔍 Vérifications DNS faites le 02/08 (résultats réels)

### 2.1. `devisflash.net` — registrar **Cloudflare** (PAS OVH)

Le DNS est **déjà configuré pour Resend** (SPF `include:_spf.resend.com` ✅, DKIM RSA ✅, DMARC ✅).

→ **Mais DevisFlash est suspendu** → ce domaine ne sert plus pour les emails. Il sera **retiré de Resend** pour libérer le slot unique du plan Free.

### 2.2. `mondedevis.eu` — registrar **OVH** (ns106.ovh.net / dns106.ovh.net) ⭐ CIBLE

| Record | Valeur actuelle | Statut |
|---|---|---|
| SPF (TXT `@`) | `v=spf1 include:amazonses.com ~all` (reste AWS SES) | ⚠️ **À remplacer** par `include:_spf.resend.com` |
| DKIM Resend (TXT `send._domainkey`) | absent | ❌ **À ajouter** (clé fournie par Resend) |
| DMARC (TXT `_dmarc`) | absent | ❌ **À ajouter** |
| MX | vide | ✅ OK (domaine d'envoi transactionnel) |

---

## 3. 🎯 STRATÉGIE RETENUE — Bascule sur `mondedevis.eu`

**Règle Resend (vérifiée doc officielle 02/08/2026)** : plan **Free = 1 seul domaine** par compte. Comme on bascule sur `mondedevis.eu`, on **retire `devisflash.net`** de Resend (DevisFlash est suspendu, plus besoin de ses emails).

**Impact sur `devisflash.net`** :
- ✅ Le domaine reste enregistré chez Cloudflare, le site `devisflash-jf.vercel.app` continue de marcher
- ❌ Il ne peut plus **envoyer d'emails** via Resend (slot libéré) — OK car DevisFlash est en suspend

---

## 4. 🔜 PLAN POUR DEMAIN MATIN (budget total ≤ 45 min)

### Étape 1 — Côté Resend (5 min) 🔍

1. Ouvre https://resend.com/domains
2. **Add Domain** → tape `mondedevis.eu` → Save → status `Pending`
3. **Note les 2-3 records DNS** affichés (SPF + DKIM + optionnel DMARC) — Resend fournit les valeurs exactes

### Étape 2 — Côté OVH (10 min) 🛠️

1. https://www.ovh.com/manager → domaine `mondedevis.eu` → Zone DNS
2. **Modifier** le TXT `@` : remplacer `v=spf1 include:amazonses.com ~all` par `v=spf1 include:_spf.resend.com ~all`
3. **Ajouter** le TXT DKIM `send._domainkey` avec la clé fournie par Resend (étape 1)
4. **Ajouter** le TXT `_dmarc` : `v=DMARC1; p=quarantine; rua=mailto:dmarc@mondedevis.eu`
5. Vérifier propagation :
   ```bash
   dig +short TXT mondedevis.eu          # doit contenir include:_spf.resend.com
   dig +short TXT send._domainkey.mondedevis.eu   # doit contenir p=...
   ```

### Étape 3 — Retour Resend → Verify + retirer devisflash.net (5 min) ✅

1. Sur Resend → clic **Verify** sur `mondedevis.eu` → status doit passer `Verified`
2. Dans la liste des domaines → **supprimer `devisflash.net`** (libère rien de plus, mais évite la confusion — optionnel si le compte Free bloque l'ajout avant suppression : dans ce cas supprimer AVANT l'ajout en Étape 1)

### Étape 4 — Mettre à jour `.env.local` de MonDevis (5 min) 🔑

```bash
cd ~/Desktop/MonDevis
# Éditer .env.local manuellement :
#   EMAIL_FROM=noreply@mondedevis.eu
#   AUTH_RESEND_FROM=noreply@mondedevis.eu
#   (garder les clés RESEND_API_KEY / AUTH_RESEND_KEY inchangées)
```

⚠️ **`.env.local` = secrets → ne PAS committer, ne PAS me demander de le modifier** (tu le fais à la main).

### Étape 5 — Lancer le test d'envoi réel (10 min) 🚀

```bash
cd ~/Desktop/MonDevis
npx tsx scripts/test-email-send.ts "ton@email.com"
```

**Critère de succès** :
- Sortie : `✓ ENVOYÉ avec succès à ...`
- Email reçu dans la boîte (pas en spam)
- `From: noreply@mondedevis.eu` (PAS `onboarding@resend.dev`)
- Gmail → `Show original` → `dkim=pass spf=pass dmarc=pass`

### Étape 6 — Si l'envoi échoue (diagnostic, 15 min) 🆘

| Erreur | Cause probable | Fix |
|---|---|---|
| `403` / "domain not verified" | `mondedevis.eu` pas encore `Verified` sur Resend | Étape 3 → Verify + re-check dig |
| SPF fail | SPF encore `amazonses.com` | Étape 2.2 → remplacer le TXT `@` |
| `dkim=fail` côté Gmail | DKIM pas propagé / TTL | Re-check `dig` Étape 2.5 |
| Email en **spam** | volume faible = normal au début | Gmail → "Pas du spam" + ajouter à contacts |

### Étape 7 — Décision GO / STOP (5 min) ⏱️

- **Si tout passe** ✅ → l'email est opérationnel sur `mondedevis.eu`. Dossier Resend fermé.
- **Si > 45 min écoulées** → **STOP** (comme convenu). On reprend plus tard, sans rien casser.

---

## 5. 📌 Ce qu'il NE FAUT PAS toucher demain

- ❌ **Peppol** : ne pas modifier (fonctionnel, verrouillé)
- ❌ **Stripe** : ne pas implémenter (seulement juste avant la vente)
- ❌ **DevisFlash** : suspendu — ne rien faire dessus (comptes IG/FB à refaire plus tard, hors scope)
- ❌ **`.env.local`** : secrets — modification **manuelle uniquement** (Étape 4), jamais committée

---

## 6. 🔗 Références utiles

| Ressource | Chemin | Usage |
|---|---|---|
| Script de test email | `~/Desktop/MonDevis/scripts/test-email-send.ts` | Test envoi réel avec PDF |
| Config emails | `~/Desktop/MonDevis/src/auth.ts` | Magic Link Resend (NextAuth) |
| Envoi devis/factures | `~/Desktop/MonDevis/src/app/actions/devis-envoi.ts`, `facture-envoi.ts` | Payload Resend exact |
| Env vars | `~/Desktop/MonDevis/.env.local` | `EMAIL_FROM`, `AUTH_RESEND_FROM`, clés |
| OVH Manager | https://www.ovh.com/manager | Zone DNS `mondedevis.eu` |
| Resend Domains | https://resend.com/domains | Add/Verify/Remove domain |
| Doc Resend (domaines) | https://resend.com/docs/dashboard/domains/introduction | Politique officielle (Free = 1 domaine) |

---

## 7. 🎯 Bilan

**Session 02/08 close-able** : landing ✅, Peppol verrouillé ✅, **DevisFlash suspendu** ✅ (décision actée), **cible email = `mondedevis.eu`** ✅ (OVH).

**Demain matin** : Resend Add Domain (5 min) → OVH zone DNS (10 min) → Verify + retirer devisflash.net (5 min) → .env.local manuel (5 min) → test d'envoi (10 min). Budget total ≈ 35 min, sous les 45 min.

*Memo close-out v2 (mis à jour 02/08/2026 soir — décision DevisFlash suspendu + bascule mondedevis.eu). À relire demain matin avant d'ouvrir Resend.*

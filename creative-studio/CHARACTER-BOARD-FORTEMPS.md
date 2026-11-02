# 👤 Character Board — Fortemps Menuiserie

> **But** : verrouiller l'apparence du personnage Fortemps pour que toutes les générations
> (images, avatars Veo) restent **le même homme** d'une vidéo à l'autre.
> **Coût** : zéro — texte + 1 image de référence générée via Pollinations (gratuit),
> réutilisée ensuite via `--image` (mécanisme déjà présent dans le studio).
> **Règle d'or** : ne jamais réécrire le visage de mémoire dans un prompt — on ancre
> « the same man from the reference » et on ne change que la scène.
> **Attention — Fortemps n'a PAS de personnage par défaut** dans sa charte (contrairement à
> MonDevis) : les visuels utilisent de vraies photos de chantier. Ce personnage est donc
> **optionnel et explicite** — on ne l'utilise que pour les vidéos avatar / campagnes dédiées.

---

## 1. Identité verrouillée (NE PAS modifier entre générations)

| Champ | Valeur |
|---|---|
| **NOM** | (personnage Fortemps — à confirmer par Jo) |
| **ÂGE** | ~50 ans |
| **CARBURE** | solide, carrure de travailleur |
| **CHEVEUX** | bruns courts, légèrement grisonnants sur les tempes |
| **YEUX** | bruns chaleureux |
| **PEAU** | hâlée, rides du métier au coin des yeux |
| **SIGNES** | barbe courte soignée grisonnante, mains de travailleur, sourire confiant |
| **TENUE** | chemise de travail en denim bleu roulée aux avant-bras, tablier en cuir brun, montre en cuir |
| **CARACTÈRE** | artisan fiable, expérimenté, fier de son savoir-faire, parle simplement |
| **HUMEUR** | chaleureux, confiant, accessible |

> ⚠️ **Proposition à ajuster** : si Jo souhaite utiliser son propre visage (ou une photo réelle)
> comme référence, remplacer la génération par la photo et garder le reste de la fiche.

## 2. Palette (charte réelle `brands/fortemps.json`)

| Usage | Hex |
|---|---|
| Fond sombre bois | `#1C140E` |
| Fond intermédiaire | `#302314` |
| Doré clair | `#F4E4C1` |
| Doré moyen (CTA) | `#C9A84C` |
| Doré foncé | `#8B6914` |
| Cuivre | `#B8956A` |
| Blanc / blanc doux | `#FFFFFF` / `#C8BEAA` |

## 3. Prompt verrouillé (pour la 1ʳᵉ génération, une seule fois)

```
un menuisier artisan belge d'une cinquantaine d'années, barbe courte soignée grisonnante,
cheveux bruns courts, yeux bruns chaleureux, peau hâlée, sourire confiant,
chemise de travail en denim bleu roulée aux avant-bras, tablier en cuir brun,
mains de travailleur, regardant face caméra, atelier de menuiserie chaleureux en fond,
lumière dorée du soir, photoréaliste, cinématique
```

→ Générer **une fois** : `python3 cli.py image --brand fortemps --prompt "<prompt ci-dessus>" --provider pollinations`

⚠️ La qualité dépend du fournisseur image. Conservée : `posts_prets/personnage-fortemps.png`.

## 4. Vues à générer (pour une fiche complète, optionnel)

Générer 4 variantes avec le **même prompt verrouillé** + la variante de vue :

- **FACE** : « de face »
- **3/4 GAUCHE** : « trois-quarts gauche »
- **PROFIL** : « profil gauche »
- **DOS** : « de dos, en tenue de travail »

## 5. Expressions (varier un seul élément à la fois)

Même prompt + une seule expression modifiée :
- neutre, souriant, concentré (rabotant une pièce), pensif, sérieux.

## 6. Éclairages / ambiances

Même prompt + ambiance : lumière douce du matin · intérieur chaud tungstène · bleu nuit froid ·
contre-jour cinématique d'atelier.

## 7. Ancrage (pour TOUTES les générations suivantes)

```
The same man from the reference image, same face, beard and hair.
Keep his identity identical.
<scène, pose, éclairage ou action — la SEULE partie qui change>
```

### Usage dans le studio

- **Navigation par défaut** : Fortemps continue de générer **sans** personnage (photos de chantier) — aucun changement.
- **Avatar qui parle (Veo)** : utiliser explicitement l'image de référence quand on veut le personnage → cohérence garantie entre vidéos :
  ```bash
  python3 cli.py avatar --brand fortemps \
    --image posts_prets/personnage-fortemps.png \
    --script "<script 8 s en français>"
  ```
- **Images avec le personnage** : passer la description verrouillée dans `--prompt`, ou réutiliser l'image via l'anchor (pas d'injection automatique).

## 8. Ce que cette fiche évite

- ❌ Le visage qui « dérive » entre deux générations (et des clients qui ne reconnaissent pas la marque).
- ❌ Réécrire la description complète à chaque prompt (c'est ce qui fait dériver l'identité).
- ❌ Une dépendance payante : le texte est verrouillé et l'image de référence est gratuite.

---

> **Source d'inspiration** : character boards utilisés en production IA (ex. runware character-consistency) —
> la même technique, déclinée en version 100 % gratuite pour le Creative Studio.
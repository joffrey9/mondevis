"""Chargement et validation des chartes de marque (brands/*.json)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any


class BrandError(Exception):
    """Erreur de configuration d'une marque."""


@dataclass
class Brand:
    name: str
    handle: str
    description: str
    logo: str | None
    colors: dict[str, str]
    fonts: list[str]
    cta: dict[str, str]
    character: str = ""
    overlay: dict[str, Any] = field(default_factory=dict)
    sizes: dict[str, str] = field(default_factory=dict)
    path: str = ""

    @property
    def logo_path(self) -> str | None:
        """Chemin absolu du logo, résolu depuis le dossier brands/."""
        if not self.logo:
            return None
        return os.path.normpath(os.path.join(os.path.dirname(self.path), self.logo))

    def color(self, key: str, default: str = "#FFFFFF") -> str:
        """Couleur de la charte avec fallback."""
        return self.colors.get(key, default)

    def hex_to_rgb(self, key: str, default: str = "#FFFFFF") -> tuple[int, int, int]:
        """Convertit une couleur de la charte en tuple RGB."""
        hex_value = self.color(key, default).lstrip("#")
        return tuple(int(hex_value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]

    def size(self, key: str = "1x1") -> tuple[int, int]:
        """Dimensions (largeur, hauteur) d'un format nommé."""
        raw = self.sizes.get(key, "1080x1080")
        w, h = raw.lower().split("x")
        return int(w), int(h)


def _hex_valid(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 7 and value.startswith("#")


def load_brand(path: str) -> Brand:
    """Charge une charte depuis un fichier JSON et la valide minimalement."""
    if not os.path.isfile(path):
        raise BrandError(f"Fichier de marque introuvable : {path}")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            raw: dict[str, Any] = json.load(fh)
    except json.JSONDecodeError as err:
        raise BrandError(f"JSON invalide dans {path} : {err}") from err
    if not isinstance(raw, dict):
        raise BrandError(f"La charte {path} doit être un objet JSON")

    name = raw.get("name") or raw.get("handle") or "Marque"
    handle = raw.get("handle") or name.lower().replace(" ", "-")
    colors = raw.get("colors", {})
    if not colors:
        raise BrandError(f"La charte {path} doit définir au moins une couleur")

    brand = Brand(
        name=str(name),
        handle=str(handle),
        description=str(raw.get("description", "")),
        character=str(raw.get("character", "") or ""),
        logo=str(raw["logo"]) if raw.get("logo") else None,
        colors={k: str(v) for k, v in colors.items()},
        fonts=[str(f) for f in raw.get("fonts", [])],
        cta={k: str(v) for k, v in (raw.get("cta", {}) or {}).items()},
        overlay=dict(raw.get("overlay", {}) or {}),
        sizes={k: str(v) for k, v in (raw.get("sizes", {}) or {}).items()},
        path=path,
    )
    return brand


def load_brand_by_handle(brands_dir: str, handle: str) -> Brand:
    """Charge une marque par son identifiant depuis le dossier brands/."""
    path = os.path.join(brands_dir, f"{handle}.json")
    if not os.path.isfile(path):
        available = list_brands(brands_dir)
        raise BrandError(
            f"Marque '{handle}' introuvable. Disponibles : {', '.join(available) or 'aucune'}"
        )
    return load_brand(path)


def list_brands(brands_dir: str) -> list[str]:
    """Liste les identifiants de marques disponibles (fichiers *.json)."""
    if not os.path.isdir(brands_dir):
        return []
    return sorted(
        f[:-5] for f in os.listdir(brands_dir) if f.endswith(".json") and not f.startswith("_")
    )

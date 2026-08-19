"""Tests Creative Studio — unittest (stdlib, sans dépendance externe)."""

import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

STUDIO_DIR = Path(__file__).resolve().parent.parent
BRANDS_DIR = STUDIO_DIR / "brands"
sys.path.insert(0, str(STUDIO_DIR))

from cli import _parse_hooks, _slugify, _with_character  # noqa: E402
from studio import providers, voiceover  # noqa: E402
from studio.brand import BrandError, load_brand, load_brand_by_handle, list_brands  # noqa: E402
from studio.overlay import apply_brand, build_overlay_layer  # noqa: E402
from studio.video import burn_captions, make_ken_burns_video  # noqa: E402


class TestBrands(unittest.TestCase):
    def test_fortemps_charte_valide(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "fortemps")
        self.assertEqual(brand.handle, "fortemps")
        self.assertEqual(brand.color("gold_mid"), "#C9A84C")
        self.assertEqual(brand.hex_to_rgb("gold_mid"), (201, 168, 76))
        self.assertEqual(brand.size("1x1"), (1080, 1080))
        self.assertEqual(brand.size("9x16"), (1080, 1920))
        self.assertIn("whatsapp", brand.cta)
        self.assertTrue(brand.cta["whatsapp"])

    def test_exemple_charte_valide(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "exemple")
        self.assertEqual(brand.handle, "exemple")
        self.assertEqual(brand.size("1x1"), (1080, 1080))

    def test_mondevis_charte_valide(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "mondevis")
        self.assertEqual(brand.handle, "mondevis")
        self.assertEqual(brand.hex_to_rgb("gold_mid"), (244, 114, 182))
        self.assertEqual(brand.size("9x16"), (1080, 1920))
        self.assertIn("jeune homme", brand.character)

    def test_fortemps_sans_personnage_defaut(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "fortemps")
        self.assertEqual(brand.character, "")

    def test_brand_inconnu_erreur_claire(self):
        with self.assertRaises(BrandError) as ctx:
            load_brand_by_handle(str(BRANDS_DIR), "inconnue")
        self.assertIn("inconnue", str(ctx.exception))
        self.assertIn("fortemps", str(ctx.exception))  # liste les dispo

    def test_list_brands_contient_fortemps(self):
        self.assertIn("fortemps", list_brands(str(BRANDS_DIR)))

    def test_json_invalide(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "bad.json"
            bad.write_text("{ pas du json", encoding="utf-8")
            with self.assertRaises(BrandError):
                load_brand(str(bad))


class TestProviders(unittest.TestCase):
    def test_mock_image_dimensions(self):
        img = providers.mock_image(1080, 1920, "atelier bois")
        self.assertEqual(img.size, (1080, 1920))
        self.assertEqual(img.mode, "RGB")

    def test_mock_image_deterministe(self):
        a = providers.mock_image(300, 300, "test", seed=1)
        b = providers.mock_image(300, 300, "test", seed=1)
        self.assertEqual(list(a.getdata()), list(b.getdata()))

    def test_google_instance_texte(self):
        inst = providers._google_instance("bonjour", None)
        self.assertEqual(inst["prompt"], "bonjour")
        self.assertNotIn("image", inst)
        self.assertNotIn("aspectRatio", inst)  # aspectRatio va dans `parameters`, pas l'instance

    def test_google_instance_image_base64(self):
        import base64

        inst = providers._google_instance("parle", b"pngbytes")
        self.assertEqual(inst["image"]["bytesBase64Encoded"], base64.b64encode(b"pngbytes").decode())
        self.assertEqual(inst["image"]["mimeType"], "image/png")  # requis par l'API Veo

    def test_google_video_sans_cle_leve_erreur(self):
        if providers.has_google_key():
            self.skipTest("GOOGLE_AI_API_KEY présente")
        with self.assertRaises(providers.ProviderError):
            providers.generate_google_video("test")


class TestOverlay(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.brand = load_brand_by_handle(str(BRANDS_DIR), "fortemps")

    def test_apply_brand_dimensions_et_mode(self):
        img = providers.mock_image(1080, 1920, "cuisine bois")
        out = apply_brand(img, self.brand, "Cuisines sur-mesure", subtext="Bois massif")
        # Sans taille explicite, la charte applique son format 1x1 par défaut
        self.assertEqual(out.size, (1080, 1080))
        self.assertEqual(out.mode, "RGB")

    def test_apply_brand_format_9x16_explicite(self):
        img = providers.mock_image(1080, 1920, "cuisine bois")
        out = apply_brand(img, self.brand, "Cuisines sur-mesure", size=(1080, 1920))
        self.assertEqual(out.size, (1080, 1920))

    def test_apply_brand_taille_personnalisee(self):
        img = providers.mock_image(800, 800, "test")
        out = apply_brand(img, self.brand, "Titre", size=(640, 640))
        self.assertEqual(out.size, (640, 640))

    def test_overlay_layer_transparente(self):
        layer = build_overlay_layer(self.brand, "Titre test", cta_label="Devis gratuit", size=(640, 640))
        self.assertEqual(layer.mode, "RGBA")
        self.assertEqual(layer.size, (640, 640))
        # La bande basse doit être semi-transparente : le canal alpha varie
        alphas = set(layer.crop((0, 400, 640, 640)).getchannel("A").getdata())
        self.assertTrue(any(a not in (0, 255) for a in alphas))

    def test_overlay_layer_avec_benefices_prix(self):
        layer = build_overlay_layer(
            self.brand, "Produit", benefits=["Bois massif", "Sur-mesure"], price="19,99 €", size=(540, 960)
        )
        self.assertEqual(layer.mode, "RGBA")
        self.assertEqual(layer.size, (540, 960))


class TestCliHelpers(unittest.TestCase):
    def test_parse_hooks(self):
        self.assertEqual(_parse_hooks("A|B|C"), ["A", "B", "C"])
        self.assertEqual(_parse_hooks("A ; B\nC"), ["A", "B", "C"])
        self.assertEqual(_parse_hooks(None), [])

    def test_slugify(self):
        self.assertEqual(_slugify("Ce menuisier change TOUT !"), "ce-menuisier-change-tout")
        self.assertEqual(_slugify("!!!"), "variant")

    def test_with_character_prefixe_le_prompt(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "mondevis")
        out = _with_character(brand, "dans son atelier")
        self.assertTrue(out.startswith(brand.character))
        self.assertTrue(out.endswith("dans son atelier"))

    def test_with_character_desactivable(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "mondevis")
        self.assertEqual(_with_character(brand, "produit", enabled=False), "produit")

    def test_with_character_marque_sans_personnage(self):
        brand = load_brand_by_handle(str(BRANDS_DIR), "fortemps")
        self.assertEqual(_with_character(brand, "escalier bois"), "escalier bois")


class TestVoiceover(unittest.TestCase):
    def test_fmt_ts(self):
        self.assertEqual(voiceover._fmt_ts(0), "00:00:00,000")
        self.assertEqual(voiceover._fmt_ts(3_661_001), "01:01:01,001")

    def test_voix_off_necessite_edge_tts_si_absent(self):
        if voiceover.is_available():
            self.skipTest("edge-tts installé")
        with self.assertRaises(RuntimeError):
            voiceover.synthesize("test")


class TestVideo(unittest.TestCase):
    def test_ken_burns_produit_mp4(self):
        if not shutil.which("ffmpeg"):
            self.skipTest("ffmpeg absent")
        brand = load_brand_by_handle(str(BRANDS_DIR), "fortemps")
        bg = providers.mock_image(1080, 1920, "atelier")
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "clip.mp4"
            result = make_ken_burns_video(
                bg, brand, "30 ans de savoir-faire", size=(540, 960), duration=2, fps=12, out_path=out
            )
            self.assertTrue(result.exists())
            self.assertGreater(result.stat().st_size, 1_000)
            self.assertEqual(result.suffix, ".mp4")

    def test_burn_captions_produit_mp4(self):
        if not shutil.which("ffmpeg"):
            self.skipTest("ffmpeg absent")
        brand = load_brand_by_handle(str(BRANDS_DIR), "fortemps")
        bg = providers.mock_image(540, 960, "atelier")
        with tempfile.TemporaryDirectory() as tmp:
            base = make_ken_burns_video(
                bg, brand, "test", size=(540, 960), duration=2, fps=12, out_path=Path(tmp) / "base.mp4"
            )
            out = burn_captions(
                base, [(0, 2_000, "Bonjour test")], Path(tmp) / "sub.mp4", size=(540, 960), font_size=24
            )
            self.assertTrue(out.exists())
            self.assertGreater(out.stat().st_size, 1_000)
            self.assertEqual(out.suffix, ".mp4")


if __name__ == "__main__":
    unittest.main()

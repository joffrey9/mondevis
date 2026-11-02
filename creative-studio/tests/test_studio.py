"""Tests Creative Studio — unittest (stdlib, sans dépendance externe)."""

import json
import os
import shutil
from unittest.mock import Mock, patch
import sys
import tempfile
import unittest
from pathlib import Path

STUDIO_DIR = Path(__file__).resolve().parent.parent
BRANDS_DIR = STUDIO_DIR / "brands"
sys.path.insert(0, str(STUDIO_DIR))

from cli import _parse_hooks, _slugify, _with_character  # noqa: E402
from studio import providers, voiceover, voice_studio  # noqa: E402
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
        self.assertEqual(list(a.get_flattened_data()), list(b.get_flattened_data()))

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

    def test_elevenlabs_tts_requete_et_audio_mp3_mock(self):
        response = Mock(status_code=200, content=b"fake-mp3", text="")
        with patch.object(providers, "ELEVENLABS_API_KEY", "test-key"):
            with patch.object(providers.requests, "post", return_value=response) as post:
                audio, alignment = providers.generate_elevenlabs_tts("Bonjour", "voice-123")
        self.assertEqual(audio, b"fake-mp3")
        self.assertIsNone(alignment)
        self.assertEqual(post.call_args.args[0], "https://api.elevenlabs.io/v1/text-to-dialogue")
        self.assertEqual(post.call_args.kwargs["json"]["inputs"], [
            {"text": "Bonjour", "voice_id": "voice-123"}
        ])
        self.assertEqual(post.call_args.kwargs["headers"]["xi-api-key"], "test-key")
        self.assertEqual(post.call_args.kwargs["json"]["model_id"], "eleven_v4")

    def test_elevenlabs_v4_utilise_endpoint_dialogue_pour_une_seule_voix(self):
        response = Mock(status_code=200, content=b"v4-mp3", text="")
        with patch.object(providers, "ELEVENLABS_API_KEY", "test-key"):
            with patch.object(providers.requests, "post", return_value=response) as post:
                audio, alignment = providers.generate_elevenlabs_tts(
                    "Bonjour", "voice-v4", "eleven_v4"
                )
        self.assertEqual(audio, b"v4-mp3")
        self.assertIsNone(alignment)
        self.assertEqual(post.call_args.args[0], "https://api.elevenlabs.io/v1/text-to-dialogue")
        self.assertEqual(post.call_args.kwargs["json"]["inputs"], [
            {"text": "Bonjour", "voice_id": "voice-v4"}
        ])

    def test_elevenlabs_timestamps_decode_audio_alignment(self):
        import base64
        payload = {"audio_base64": base64.b64encode(b"mp3").decode(), "alignment": {"characters": ["O"]}}
        response = Mock(status_code=200, text="", json=lambda: payload)
        with patch.object(providers, "ELEVENLABS_API_KEY", "test-key"):
            with patch.object(providers.requests, "post", return_value=response) as post:
                audio, alignment = providers.generate_elevenlabs_tts(
                "O", "voice-1", "eleven_multilingual_v2", with_timestamps=True
            )
        self.assertEqual(audio, b"mp3")
        self.assertEqual(alignment, payload["alignment"])
        self.assertTrue(post.call_args.args[0].endswith("/with-timestamps"))

    def test_elevenlabs_v4_refuse_timestamps_au_lieu_de_perdre_alignment(self):
        with patch.object(providers, "ELEVENLABS_API_KEY", "test-key"):
            with patch.object(providers.requests, "post") as post:
                with self.assertRaisesRegex(providers.ProviderError, "ne fournit pas les timings"):
                    providers.generate_elevenlabs_tts(
                        "Bonjour", "voice-v4", "eleven_v4", with_timestamps=True
                    )
                post.assert_not_called()

    def test_liste_voix_elevenlabs_sans_resultat_explique_le_vide(self):
        from argparse import Namespace
        from io import StringIO
        from contextlib import redirect_stdout
        from cli import cmd_voice

        args = Namespace(
            list_voices=False, list_eleven_voices=True, eleven_search="Belgian",
            batch=None, script=None, compare=False, engine="edge",
            eleven_voice_id=None, eleven_model="eleven_v4", captions=False,
            max_words=4, music=None, music_volume=0.15, out_dir=None, base=None,
            voice="be-m",
        )
        buffer = StringIO()
        with patch.object(providers, "ELEVENLABS_API_KEY", "test-key"):
            with patch.object(providers, "elevenlabs_voices", return_value=[]):
                with redirect_stdout(buffer):
                    cmd_voice(args)
        output = buffer.getvalue()
        self.assertIn("Aucune voix ElevenLabs trouvée", output)
        self.assertIn("Belgian", output)
        self.assertIn("Voice Library", output)

    def test_elevenlabs_validation_sans_cle_ou_script(self):
        with patch.object(providers, "ELEVENLABS_API_KEY", ""):
            with self.assertRaisesRegex(providers.ProviderError, "ELEVENLABS_API_KEY"):
                providers.generate_elevenlabs_tts("Bonjour", "voice-1")
        with patch.object(providers, "ELEVENLABS_API_KEY", "test-key"):
            with patch.object(providers.requests, "post") as post:
                with self.assertRaisesRegex(providers.ProviderError, "script et un voice ID"):
                    providers.generate_elevenlabs_tts(" ", "")
                post.assert_not_called()

    def test_kie_avatar_sans_cle_leve_erreur(self):
        with patch.object(providers, "KIE_API_KEY", ""):
            with self.assertRaisesRegex(providers.ProviderError, "KIE_API_KEY"):
                providers.generate_kie_avatar(b"image", b"audio", "parle")

    def test_kie_avatar_poll_upload_et_download_mocks(self):
        upload = Mock(status_code=200, text="", json=lambda: {
            "success": True, "code": 200, "data": {"downloadUrl": "https://files.test/input"}
        })
        created = Mock(status_code=200, text="", json=lambda: {"code": 200, "data": {"taskId": "task-1"}})
        pending = Mock(status_code=200, text="", json=lambda: {"code": 200, "data": {"state": "generating"}})
        complete = Mock(status_code=200, text="", json=lambda: {
            "code": 200, "data": {"state": "success", "resultJson": '{"resultUrls":["https://files.test/video.mp4"]}'}
        })
        download = Mock(status_code=200, content=b"mp4-bytes")
        with patch.object(providers, "KIE_API_KEY", "test-key"), \
             patch.object(providers.requests, "post", side_effect=[upload, upload, created]) as post, \
             patch.object(providers.requests, "get", side_effect=[pending, complete, download]), \
             patch.object(providers.time, "sleep"):
            result = providers.generate_kie_avatar(b"png", b"mp3", "parle", poll_timeout=5)
        self.assertEqual(result, b"mp4-bytes")
        self.assertEqual(post.call_count, 3)
        self.assertEqual(post.call_args_list[-1].kwargs["json"]["model"], providers.KIE_AVATAR_STANDARD)

    def test_kie_avatar_remonte_erreur_api_et_echec_job(self):
        unauthorized = Mock(status_code=200, text="", json=lambda: {"code": 401, "msg": "unauthorized"})
        with patch.object(providers, "KIE_API_KEY", "test-key"), \
             patch.object(providers.requests, "post", return_value=unauthorized):
            with self.assertRaisesRegex(providers.ProviderError, "code 401"):
                providers.generate_kie_avatar(b"png", b"mp3", "parle")

        uploaded = Mock(status_code=200, text="", json=lambda: {
            "success": True, "code": 200, "data": {"downloadUrl": "https://files.test/input"}
        })
        created = Mock(status_code=200, text="", json=lambda: {"code": 200, "data": {"taskId": "task-2"}})
        failed = Mock(status_code=200, text="", json=lambda: {
            "code": 200, "data": {"state": "fail", "failCode": "500", "failMsg": "render error"}
        })
        with patch.object(providers, "KIE_API_KEY", "test-key"), \
             patch.object(providers.requests, "post", side_effect=[uploaded, uploaded, created]), \
             patch.object(providers.requests, "get", return_value=failed):
            with self.assertRaisesRegex(providers.ProviderError, "render error"):
                providers.generate_kie_avatar(b"png", b"mp3", "parle", poll_timeout=2)

    def test_kie_avatar_reponse_sans_video_est_rejetee(self):
        uploaded = Mock(status_code=200, text="", json=lambda: {
            "success": True, "code": 200, "data": {"downloadUrl": "https://files.test/input"}
        })
        created = Mock(status_code=200, text="", json=lambda: {"code": 200, "data": {"taskId": "task-3"}})
        complete_without_url = Mock(status_code=200, text="", json=lambda: {
            "code": 200, "data": {"state": "success", "resultJson": "{}"}
        })
        with patch.object(providers, "KIE_API_KEY", "test-key"), \
             patch.object(providers.requests, "post", side_effect=[uploaded, uploaded, created]), \
             patch.object(providers.requests, "get", return_value=complete_without_url):
            with self.assertRaisesRegex(providers.ProviderError, "sans URL vidéo"):
                providers.generate_kie_avatar(b"png", b"mp3", "parle", poll_timeout=2)


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
        alphas = set(layer.crop((0, 400, 640, 640)).getchannel("A").get_flattened_data())
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
    def test_elevenlabs_alignment_converti_en_sous_titres(self):
        alignment = {
            "characters": list("Salut Jo"),
            "character_start_times_seconds": [0.0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8],
            "character_end_times_seconds": [0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.8, 0.9],
        }
        captions = voice_studio._captions_from_alignment(alignment, max_words=1)
        self.assertEqual(captions, [(0, 500, "Salut"), (700, 900, "Jo")])
        srt = voice_studio._srt_from_alignment("Salut Jo", alignment, max_words=1)
        self.assertIn("00:00:00,000 --> 00:00:00,500", srt)
        self.assertIn("Jo", srt)
        self.assertIn("00:00:00,700 --> 00:00:00,900", srt)

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

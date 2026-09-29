import base64
import inspect
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pydantic import ValidationError
from fastapi.testclient import TestClient

from services.hunyuan3d import studio_api

GenerateRequest = studio_api.GenerateRequest
create_job_record = studio_api.create_job_record
output_path = studio_api.output_path
resolve_sku_image = studio_api.resolve_sku_image


class StudioApiContractTests(unittest.TestCase):
    def test_gateway_requires_server_token_and_explicit_generation_enablement(self):
        client = TestClient(studio_api.app)
        with patch.dict(os.environ, {"STUDIO_GATEWAY_TOKEN": "test-only", "STUDIO_GENERATION_ENABLED": "false"}):
            self.assertEqual(client.get("/jobs/" + "a" * 32).status_code, 401)
            self.assertEqual(client.get("/jobs/" + "a" * 32, headers={"Authorization": "Bearer wrong"}).status_code, 401)
            self.assertEqual(client.post("/concept-images", headers={"Authorization": "Bearer test-only"}, json={}).status_code, 503)
        with patch.dict(os.environ, {"STUDIO_GATEWAY_TOKEN": ""}):
            self.assertEqual(client.get("/health").status_code, 503)

    def test_resolves_only_catalog_sku_images(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            project_root = Path(temporary_directory)
            image_path = (
                project_root
                / "public"
                / "assets"
                / "products"
                / "gt-jar-050-v2.png"
            )
            image_path.parent.mkdir(parents=True)
            image_path.touch()

            self.assertEqual(
                resolve_sku_image("GT-JAR-050", project_root),
                image_path.resolve(),
            )

            brochure_image = project_root / "public" / "assets" / "packaging" / "hd-843.png"
            brochure_image.parent.mkdir(parents=True)
            brochure_image.touch()
            self.assertEqual(resolve_sku_image("HD-843", project_root), brochure_image.resolve())

            size_image = project_root / "public" / "assets" / "packaging" / "hd-998-800ml.png"
            size_image.touch()
            self.assertEqual(resolve_sku_image("HD-998-800ML", project_root), size_image.resolve())
            self.assertEqual(len([sku for sku in studio_api.SKU_IMAGE_PATHS if sku.startswith("HD-")]), 144)

            with self.assertRaisesRegex(ValueError, "Unknown catalog SKU"):
                resolve_sku_image("../../not-a-sku", project_root)

    def test_creates_a_visible_queued_job(self):
        job = create_job_record(
            job_id="job-123",
            sku="GT-JAR-050",
            engine="hunyuan3d",
            steps=50,
            seed=1234,
            octree_resolution=384,
            preserve_native_mesh=True,
            concept_image_id="0123456789abcdef0123456789abcdef",
        )

        self.assertEqual(job["status"], "queued")
        self.assertEqual(job["progress"], 5)
        self.assertEqual(job["sku"], "GT-JAR-050")
        self.assertEqual(job["engine"], "hunyuan3d")
        self.assertEqual(job["octree_resolution"], 384)
        self.assertTrue(job["preserve_native_mesh"])
        self.assertEqual(
            job["concept_image_id"],
            "0123456789abcdef0123456789abcdef",
        )
        self.assertIsNone(job["model_url"])
        self.assertEqual(job["message"], "正在安排生成")
        self.assertNotIn("gpu", json.dumps(job).lower())

    def test_keeps_worker_quality_settings_out_of_the_public_request(self):
        with self.assertRaises(ValidationError):
            GenerateRequest.model_validate({"sku": "GT-JAR-050"})

        request = GenerateRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "conceptImageId": "0123456789abcdef0123456789abcdef",
            }
        )

        self.assertEqual(
            request.concept_image_id,
            "0123456789abcdef0123456789abcdef",
        )
        self.assertEqual(studio_api.GENERATION_STEPS, 50)
        self.assertEqual(studio_api.OCTREE_RESOLUTION, 384)
        self.assertTrue(studio_api.PRESERVE_NATIVE_MESH)
        public_fields = set(request.model_dump(by_alias=True))
        self.assertTrue(
            {
                "engine",
                "steps",
                "octreeResolution",
                "preserveNativeMesh",
            }.isdisjoint(public_fields)
        )

        with self.assertRaises(ValidationError):
            GenerateRequest.model_validate(
                {
                    "sku": "GT-JAR-050",
                    "conceptImageId": "0123456789abcdef0123456789abcdef",
                    "engine": "hunyuan3d",
                }
            )

    def test_reads_gradio_update_file_output(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            model_path = Path(temporary_directory) / "white_mesh.glb"
            model_path.touch()

            self.assertEqual(
                output_path({"value": str(model_path), "__type__": "update"}),
                model_path,
            )

    def test_preserves_selected_product_specifications(self):
        request = GenerateRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "conceptImageId": "0123456789abcdef0123456789abcdef",
                "specifications": {
                    "capacity": "80g",
                    "material": "petg",
                    "color": "copper",
                    "finish": "gloss",
                    "branding": "foil",
                    "logo-position": "front-lower",
                },
            }
        )

        self.assertIn("specifications", request.model_dump())

    def test_job_contract_carries_only_a_server_issued_concept_image_id(self):
        self.assertIn(
            "concept_image_id",
            inspect.signature(create_job_record).parameters,
        )
        job = create_job_record(
            job_id="job-456",
            sku="GT-JAR-050",
            engine="hunyuan3d",
            steps=50,
            seed=1234,
            octree_resolution=384,
            preserve_native_mesh=True,
            concept_image_id="0123456789abcdef0123456789abcdef",
        )
        self.assertEqual(
            job["concept_image_id"],
            "0123456789abcdef0123456789abcdef",
        )

        with self.assertRaises(ValidationError):
            GenerateRequest.model_validate(
                {
                    "sku": "GT-JAR-050",
                    "conceptImageId": "../../client-file.png",
                }
            )

    def test_resolves_concept_images_without_accepting_paths(self):
        self.assertTrue(hasattr(studio_api, "resolve_concept_image"))
        resolver = getattr(studio_api, "resolve_concept_image")
        with tempfile.TemporaryDirectory() as temporary_directory:
            concept_root = Path(temporary_directory)
            concept_id = "0123456789abcdef0123456789abcdef"
            image_path = concept_root / f"{concept_id}.png"
            image_path.write_bytes(b"\x89PNG\r\n\x1a\n")

            self.assertEqual(
                resolver(concept_id, concept_root),
                image_path.resolve(),
            )
            with self.assertRaisesRegex(ValueError, "Invalid concept image id"):
                resolver("../../client-file", concept_root)

    def test_decodes_only_a_valid_png_from_the_openai_response(self):
        self.assertTrue(hasattr(studio_api, "decode_openai_image_response"))
        decoder = getattr(studio_api, "decode_openai_image_response")
        png = b"\x89PNG\r\n\x1a\nvalid-test-image"
        payload = json.dumps(
            {"data": [{"b64_json": base64.b64encode(png).decode("ascii")}]}
        ).encode("utf-8")

        self.assertEqual(decoder(payload), png)
        with self.assertRaisesRegex(RuntimeError, "valid PNG"):
            decoder(json.dumps({"data": [{"b64_json": "bm90LXBuZw=="}]}).encode())

    def test_exposes_gpt_image_2_as_a_server_side_service(self):
        self.assertTrue(hasattr(studio_api, "image_generator_details"))
        details = getattr(studio_api, "image_generator_details")({})
        self.assertEqual(details["provider"], "openai")
        self.assertEqual(details["model"], "gpt-image-2")
        self.assertFalse(details["configured"])

        configured = getattr(studio_api, "image_generator_details")(
            {"OPENAI_API_KEY": "test-only-secret"}
        )
        self.assertTrue(configured["configured"])

    def test_rejects_a_whitespace_only_concept_brief(self):
        self.assertTrue(hasattr(studio_api, "ConceptImageRequest"))
        with self.assertRaises(ValidationError):
            studio_api.ConceptImageRequest.model_validate(
                {
                    "sku": "GT-JAR-050",
                    "prompt": "            ",
                    "specifications": {},
                }
            )

    def test_reports_an_openai_timeout_without_exposing_the_key(self):
        self.assertTrue(hasattr(studio_api, "generate_concept_png"))
        request = studio_api.ConceptImageRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "prompt": "设计一款低矮稳重、盖子更薄的高端面霜罐。",
                "specifications": {},
            }
        )
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-only-secret"}):
            with patch(
                "services.hunyuan3d.studio_api.urllib.request.urlopen",
                side_effect=TimeoutError("test-only-secret"),
            ):
                with self.assertRaisesRegex(
                    studio_api.ImageGenerationUnavailable,
                    "无法连接 OpenAI 图片服务",
                ) as raised:
                    studio_api.generate_concept_png(request)
        self.assertNotIn("test-only-secret", str(raised.exception))

    def test_public_health_exposes_capabilities_not_worker_hardware(self):
        self.assertTrue(hasattr(studio_api, "public_service_status"))
        status = studio_api.public_service_status(
            image_ready=True,
            model_ready=True,
            queue_depth=2,
        )

        self.assertEqual(
            status,
            {
                "ready": True,
                "image_ready": True,
                "model_ready": True,
                "busy": True,
                "estimated_wait_seconds": 180,
            },
        )
        self.assertTrue(
            {
                "gpu",
                "hunyuan_online",
                "image_generation",
                "engine",
                "provider",
                "model",
            }.isdisjoint(status)
        )

    def test_marks_generated_assets_as_private_immutable_browser_cache(self):
        self.assertTrue(hasattr(studio_api, "generated_asset_headers"))
        self.assertEqual(
            studio_api.generated_asset_headers(),
            {"Cache-Control": "private, max-age=604800, immutable"},
        )

    def test_concept_and_model_cache_ids_are_stable(self):
        self.assertTrue(hasattr(studio_api, "concept_cache_id"))
        self.assertTrue(hasattr(studio_api, "generation_cache_id"))
        concept_request = studio_api.ConceptImageRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "prompt": "设计一款低矮稳重、盖子更薄的高端面霜罐。",
                "specifications": {"finish": "satin", "capacity": "50g"},
            }
        )
        reordered_request = studio_api.ConceptImageRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "prompt": "设计一款低矮稳重、盖子更薄的高端面霜罐。",
                "specifications": {"capacity": "50g", "finish": "satin"},
            }
        )
        concept_id = studio_api.concept_cache_id(concept_request)
        self.assertEqual(concept_id, studio_api.concept_cache_id(reordered_request))
        self.assertRegex(concept_id, r"^[a-f0-9]{32}$")

        model_request = GenerateRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "conceptImageId": concept_id,
                "seed": 1234,
                "specifications": {"capacity": "50g", "finish": "satin"},
            }
        )
        model_id = studio_api.generation_cache_id(model_request)
        self.assertEqual(model_id, studio_api.generation_cache_id(model_request))
        self.assertRegex(model_id, r"^[a-f0-9]{32}$")

    def test_reuses_a_concept_image_without_exposing_its_cache_key(self):
        request = studio_api.ConceptImageRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "prompt": "设计一款低矮稳重、盖子更薄的高端面霜罐。",
                "specifications": {"capacity": "50g", "finish": "satin"},
            }
        )
        cache_key = studio_api.concept_cache_id(request)
        png = b"\x89PNG\r\n\x1a\ntest-concept"

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_root = Path(temporary_directory)
            concept_root = output_root / "concepts"
            metadata_root = output_root / "concept-cache"
            with (
                patch.object(studio_api, "CONCEPT_ROOT", concept_root),
                patch.object(studio_api, "CONCEPT_METADATA_ROOT", metadata_root),
                patch.object(studio_api, "resolve_sku_image"),
                patch.object(
                    studio_api,
                    "generate_concept_png",
                    return_value=png,
                ) as generate_concept_png,
            ):
                first = studio_api.create_concept_image(request)
                second = studio_api.create_concept_image(request)

        self.assertFalse(first["cached"])
        self.assertTrue(second["cached"])
        self.assertEqual(first["id"], second["id"])
        self.assertNotEqual(first["id"], cache_key)
        self.assertRegex(first["id"], r"^[a-f0-9]{32}$")
        generate_concept_png.assert_called_once_with(request)

    def test_restores_a_completed_model_after_the_gateway_restarts(self):
        self.assertTrue(hasattr(studio_api, "restore_cached_job"))
        request = GenerateRequest.model_validate(
            {
                "sku": "GT-JAR-050",
                "conceptImageId": "0123456789abcdef0123456789abcdef",
                "seed": 1234,
            }
        )
        cache_key = studio_api.generation_cache_id(request)
        public_job_id = "fedcba9876543210fedcba9876543210"

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_root = Path(temporary_directory)
            model_path = (
                output_root
                / "model-cache"
                / cache_key
                / f"gt-jar-050-{cache_key[:8]}.glb"
            )
            model_path.parent.mkdir(parents=True)
            model_path.write_bytes(b"cached-glb")

            job = studio_api.restore_cached_job(
                request,
                public_job_id,
                output_root,
            )

        self.assertIsNotNone(job)
        self.assertEqual(job["id"], public_job_id)
        self.assertNotEqual(job["id"], cache_key)
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["progress"], 100)
        self.assertEqual(job["message"], "3D 预览已完成")
        self.assertEqual(job["model_url"], f"/jobs/{public_job_id}/model")

    def test_derives_a_browser_preview_without_discarding_the_master(self):
        self.assertTrue(hasattr(studio_api, "stage_model_assets"))
        import trimesh

        cache_key = "1234567890abcdef1234567890abcdef"
        with tempfile.TemporaryDirectory() as temporary_directory:
            output_root = Path(temporary_directory)
            source = output_root / "source.glb"
            trimesh.creation.icosphere(subdivisions=4).export(source)

            assets = studio_api.stage_model_assets(
                source,
                cache_key,
                "GT-JAR-050",
                output_root,
                target_faces=1_000,
            )
            preview = trimesh.load(assets["preview_path"], force="scene")
            preview_faces = sum(
                len(geometry.faces) for geometry in preview.geometry.values()
            )

            self.assertEqual(
                Path(assets["master_path"]).read_bytes(),
                source.read_bytes(),
            )
            self.assertLessEqual(preview_faces, 1_100)
            self.assertTrue(assets["optimized"])


if __name__ == "__main__":
    unittest.main()

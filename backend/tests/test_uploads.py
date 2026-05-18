import base64
import io

# 1x1 PNG
_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def _png_bytes():
    return io.BytesIO(_PNG)


class TestUploads:
    def test_upload_requires_auth(self, client):
        response = client.post("/api/uploads", data={"files": (_png_bytes(), "photo.png")})
        assert response.status_code == 401

    def test_upload_image_returns_url(self, auth_client):
        client = auth_client()
        response = client._client.post(
            "/api/uploads",
            data={"files": (_png_bytes(), "photo.png")},
            headers=client._headers(),
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
        body = response.get_json()
        assert len(body["urls"]) == 1
        assert body["urls"][0].startswith("/api/uploads/")

        served = client.get(body["urls"][0])
        assert served.status_code == 200

    def test_upload_rejects_non_images(self, auth_client):
        client = auth_client()
        response = client._client.post(
            "/api/uploads",
            data={"files": (io.BytesIO(b"not-an-image"), "notes.txt")},
            headers=client._headers(),
            content_type="multipart/form-data",
        )
        assert response.status_code == 400

import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

SUBMISSIONS_BUCKET = os.environ["SUBMISSIONS_BUCKET"]
SUBMISSIONS_TABLE = os.environ["SUBMISSIONS_TABLE"]
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "*")
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def build_response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": CORS_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        "body": json.dumps(payload),
    }


def normalize_path(raw_path):
    if not raw_path:
        return ""
    return raw_path.rstrip("/")


def validate_payload(data):
    required_fields = [
        "fullName",
        "email",
        "paperTitle",
        "researchArea",
        "abstract",
        "fileName",
        "fileType",
        "fileSize",
    ]

    for field in required_fields:
        value = data.get(field)
        if value is None:
            return f"Missing field: {field}"
        if isinstance(value, str) and not value.strip():
            return f"Field cannot be empty: {field}"

    email = str(data["email"]).strip()
    if not EMAIL_PATTERN.match(email):
        return "Invalid email address"

    file_name = str(data["fileName"]).strip()
    file_type = str(data["fileType"]).strip().lower()

    if not file_name.lower().endswith(".pdf"):
        return "Only PDF files are allowed"

    if file_type != "application/pdf":
        return "Invalid file type. PDF is required"

    try:
        file_size = int(data["fileSize"])
    except (TypeError, ValueError):
        return "Invalid file size"

    if file_size <= 0 or file_size > MAX_FILE_SIZE_BYTES:
        return "PDF must be between 1 byte and 10 MB"

    return None


def create_submission_upload_url(payload):
    submission_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    file_key = f"submissions/{datetime.now(timezone.utc).year}/{submission_id}.pdf"

    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": SUBMISSIONS_BUCKET,
            "Key": file_key,
            "ContentType": "application/pdf",
        },
        ExpiresIn=900,
    )

    table = dynamodb.Table(SUBMISSIONS_TABLE)
    table.put_item(
        Item={
            "submissionId": submission_id,
            "createdAt": timestamp,
            "fullName": payload["fullName"].strip(),
            "email": payload["email"].strip().lower(),
            "paperTitle": payload["paperTitle"].strip(),
            "researchArea": payload["researchArea"].strip(),
            "abstract": payload["abstract"].strip(),
            "sourceFileName": payload["fileName"].strip(),
            "fileType": "application/pdf",
            "fileSize": int(payload["fileSize"]),
            "storageBucket": SUBMISSIONS_BUCKET,
            "storageKey": file_key,
            "status": "UPLOAD_URL_ISSUED",
        }
    )

    return {
        "submissionId": submission_id,
        "uploadUrl": upload_url,
        "uploadMethod": "PUT",
        "uploadHeaders": {
            "Content-Type": "application/pdf"
        },
        "expiresInSeconds": 900,
    }


def lambda_handler(event, _context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = normalize_path(event.get("rawPath", ""))

    if method == "OPTIONS":
        return build_response(200, {"ok": True})

    if method == "GET" and path.endswith("/api/cfp/health"):
        return build_response(200, {"ok": True, "service": "cfp-submissions"})

    if method == "POST" and path.endswith("/api/cfp/submission-url"):
        try:
            body = event.get("body") or "{}"
            if event.get("isBase64Encoded"):
                return build_response(400, {"message": "Invalid request body encoding"})

            payload = json.loads(body)
        except json.JSONDecodeError:
            return build_response(400, {"message": "Request body must be valid JSON"})

        error = validate_payload(payload)
        if error:
            return build_response(400, {"message": error})

        try:
            submission = create_submission_upload_url(payload)
            return build_response(200, submission)
        except ClientError as error:
            print("AWS ClientError", error)
            return build_response(500, {"message": "Unable to prepare upload at this time"})

    return build_response(404, {"message": "Route not found"})

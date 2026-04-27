# IEEE URUCON 2026 Website

## Repository

**Name:** urucon2026

**Link:** https://github.com/beluume/urucon2026.git

---

## Description

This repository contains the official website for **IEEE URUCON 2026**, including all sections related to the conference such as registration, call for papers, and general event information.

The project is built using **HTML, CSS, and JavaScript** focused on a responsive design.

---

## How to Run

1. Clone the repository:

```
git clone https://github.com/beluume/urucon2026.git
```

2. Open `index.html` in your browser.

---

## Notes:

- The Call for Papers form now uses an AWS-backed submission flow:
	1. Frontend requests a secure upload URL from API Gateway + Lambda.
	2. PDF is uploaded directly to S3 through the pre-signed URL.
	3. Submission metadata is stored in DynamoDB.

---

## AWS Deployment Requirements

The GitHub Actions workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) now deploys both:

1. Static website to S3/CloudFront
2. CFP backend stack (API Gateway, Lambda, DynamoDB, submissions S3 bucket)

Set these repository settings before running the pipeline:

- **Secrets**
	- `AWS_ROLE_TO_ASSUME`

- **Variables**
	- `AWS_REGION`
	- `S3_BUCKET`
	- `CLOUDFRONT_DISTRIBUTION_ID` (optional)

The workflow derives backend settings automatically:

- CloudFormation stack: `urucon-cfp-backend`
- CFP submissions bucket: `${S3_BUCKET}-cfp-submissions`
- CFP API CORS origin: `*`

Backend infrastructure template: [backend/template.yaml](backend/template.yaml)
Lambda handler source: [backend/cfp_handler.py](backend/cfp_handler.py)

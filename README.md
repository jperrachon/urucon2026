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

## AWS Deployment Requirements

The GitHub Actions workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) deploys the static website to S3/CloudFront.

Set these repository settings before running the pipeline:

- **Secrets**
	- `AWS_ROLE_TO_ASSUME`

- **Variables**
	- `AWS_REGION`
	- `S3_BUCKET`
	- `CLOUDFRONT_DISTRIBUTION_ID` (optional)


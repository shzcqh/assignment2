## Distributed Systems – Event-Driven Photo-Gallery (AWS CDK)

|                         |                                                         |
|-------------------------|---------------------------------------------------------|
| **Name / Student ID**   | **Huaze Shao (20109117)**                               |
| **Demo Video**          | <https://youtu.be/IcHTiSoSIFo>                          |
| **Repository URL**      | <https://github.com/shzcqh/assignment2>                 |

This project implements a **serverless, event-driven photo-gallery backend** on AWS.  
Core services—**S3 → SQS → Lambda (+ DynamoDB, SES)**—are provisioned with AWS CDK (TypeScript), forming a complete upload-moderation-notification pipeline.

![High-level Architecture](./images/arch.png)

---

### 🗂️ Repository Layout

| Path / folder | Purpose |
|---------------|---------|
| `cdk/`        | CDK stacks – S3 bucket, SQS queues, Lambda functions, DynamoDB table, SES setup |
| `lambdas/`    | All Lambda handlers (`photographer*`, `moderator*`, `mailer*`) |
| `images/`     | Architecture PNGs / diagrams |
| `scripts/`    | Local helper scripts (e.g. mass-upload test images) |
| `README.md`   | **Project description (this file)** |

---

### 🚀 Deploy & Run

> Requirements: Node ≥ 18, AWS CLI configured, CDK v2 installed (`npm i -g aws-cdk`).

```bash
# install dependencies
npm install

# first-time bootstrap (per account/region)
cdk bootstrap

# deploy all stacks
cdk deploy --all

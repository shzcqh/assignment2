# Assignment 2 – Event-Driven Photo Gallery

**Student:** 20109117 – Huaze Shao  
**Course:** Distributed Systems  
**Submission:** Private GitHub repo (will be made public after deadline)

---

## 📖 Project Overview

This project implements a simple photo-gallery backend on AWS using an Event-Driven Architecture and CDK:

1. **Photographer** uploads images (.jpeg/.png) → recorded in DynamoDB  
2. **Photographer** sends metadata (Caption, Date, Name) via SNS → DynamoDB fields updated  
3. **Invalid uploads** (other extensions) automatically removed via SQS DLQ + Lambda  
4. **Moderator** submits Pass/Reject status via SNS → DynamoDB updated + email sent via SES  

![Architecture Diagram](./architecture.png)  
*(Place your architecture diagram here.)*

---

## 🔧 Prerequisites

- AWS account in **eu-west-1**  
- AWS CLI configured (`aws configure`)  
- Docker or local esbuild (`npm install -D esbuild` + `export AWSCDK_DISABLE_DOCKER=1`)  
- SES: verified email `20109117@mail.wit.ie` (source & recipient)

---

## 🚀 Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build CDK
npm run build

# 3. Deploy the stack
cdk deploy

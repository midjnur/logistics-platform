# Logistics Platform

AI-powered logistics platform designed to connect **shippers** and **carriers** in a transparent, efficient, and digital-first way.

The platform focuses on real logistics workflows: shipments, offers, vehicles, documents, and users — with an emphasis on scalability, automation, and modern developer tooling.

---

## 🚀 Project Goals

- Digitalize the shipper–carrier interaction
- Provide clear shipment and offer lifecycle
- Support document handling (contracts, CMR, IDs, etc.)
- Enable future AI-driven features (pricing, matching, optimization)
- Be production-ready from early stages

---

## 🧱 Architecture Overview (Local Development)

### Running Services (Docker Compose)

| Service   | Description                              | Port |
|----------|------------------------------------------|------|
| Frontend | Next.js application (web UI)              | 3000 |
| Backend  | API service (Node.js / NestJS)            | 4000 |
| Postgres | Main relational database                  | 5432 |
| Redis    | Cache / queue / session storage           | 6379 |
| MinIO    | S3-compatible object storage (documents)  | 9000 |
| MinIO UI | MinIO web console                         | 9001 |

---

## 🔧 Tooling & Development Flow

- **MacOS** (local development)
- **Docker & Docker Compose** for service orchestration
- **GitHub** for version control
- **GitHub Desktop** + Terminal workflow
- **Antigravity** AI development environment
  - MCP running locally on `:7000`
- **Browser** for frontend and service access

Repository location:
```bash
~/projects/logistics-platform

logistics-platform/
├── backend/            # Backend API (NestJS)
├── frontend/           # Frontend app (Next.js)
├── docker-compose.yml  # Local orchestration
├── project_specification.md
├── project_requirements.md
├── gap_analysis.md
└── README.md

Access points
	•	Frontend: http://localhost:3000
	•	Backend API: http://localhost:4000
	•	MinIO Console: http://localhost:9001

⸻

🔐 Environment & Configuration
	•	Environment variables are managed via Docker Compose
	•	Secrets and production credentials must not be committed
	•	.env files are excluded from version control

⸻

🗄️ Data & Storage
	•	Postgres is used as the main transactional database
	•	Redis is used for fast-access data and future async workflows
	•	MinIO is used for storing documents and binary files (S3-compatible)

⸻

🔄 Git Workflow (Current Phase)
	•	Single main branch (main)
	•	Work-in-progress commits allowed
	•	Typical flow:
	•	Fetch before starting work
	•	Commit after logical changes
	•	Push at the end of a session

Branching strategy (dev, feature/*) will be introduced later.

⸻

🧠 Future Roadmap (High-Level)
	•	Authentication & role-based access (shipper / carrier)
	•	Shipment lifecycle management
	•	Offer & bidding system
	•	Vehicle & driver management
	•	Document upload & validation
	•	AI-assisted matching and pricing
	•	Production deployment (Vercel / Cloud)

⸻

⚠️ Status

This project is under active development.
The current state is work-in-progress, focused on building a solid foundation.

⸻

👤 Author

Developed by the project owner as part of a long-term digital logistics initiative.

⸻

📜 License

License to be defined.

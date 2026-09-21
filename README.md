# NetEvolve: RoNeTC+ Multi-View Evidential Network Traffic Classification & Continual Zero-Day Discovery

[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch 2.4](https://img.shields.io/badge/PyTorch-2.4-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Dataset: UNSW-NB15](https://img.shields.io/badge/Dataset-UNSW--NB15-brightgreen.svg)](https://research.unsw.edu.au/projects/unsw-nb15-dataset)

---

## 📌 Executive Summary

**NetEvolve** is an enterprise-grade AI Network Detection and Response (NDR) platform powered by **RoNeTC+** (*Robust Network Traffic Classifier Plus*). It unifies multi-view deep neural networks, evidential uncertainty reasoning, unsupervised novel class discovery, and continual class-incremental learning into a real-time Security Operations Center (SOC) command console.

Legacy Network Intrusion Detection Systems (NIDS)—including standard Random Forests, Multi-Layer Perceptrons, and Softmax-based Deep Neural Networks—rely on a **closed-world assumption**: they force every incoming network flow into fixed known categories. When confronted with novel zero-day attacks, traditional classifiers assign incorrect labels with dangerously high confidence.

**RoNeTC+ eliminates this vulnerability through a six-pillar architecture:**
1. **Multi-View Domain Feature Splicing**: Projects raw network packet headers and metadata into 3 domain views (IP, Transport, and Payload byte patterns) structured as $11 \times 11$ 2D spatial feature grids.
2. **Evidential Deep Learning (Subjective Logic)**: Replaces heuristic Softmax with Dirichlet opinion generators that explicitly quantify second-order epistemic uncertainty ($u = K / S$) alongside class belief masses ($b_k$).
3. **Dempster-Shafer Multi-View Fusion**: Fuses the three independent view opinions mathematically, automatically giving higher weight to views with lower uncertainty while rejecting adversarial spoofing.
4. **Open-Set Zero-Day Rejection**: Calibrates an optimal decision threshold ($\tau = 0.1844$ via Youden's Index), allowing the gateway to safely reject and quarantine unrecognized zero-day flows ($u \ge \tau$) as `UNKNOWN`.
5. **Novel Class Discovery (NCD)**: Pools high-uncertainty zero-day latent embeddings ($384$-dimensional) and applies unsupervised K-Means/DBSCAN clustering to identify novel threat clusters and correlate them against the **MITRE ATT&CK** matrix.
6. **Dynamic Continual Incremental Learning**: Allows SOC operators to selectively expand the model's classifier heads to incorporate discovered traffic threats with **0.00% catastrophic forgetting** of historical knowledge and zero service downtime.

---

## 🔄 End-to-End System Pipeline

```
                               [ Incoming Network Packet Flow ]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
              [ Flow Normalizer ]                             [ Multi-View Splicer ]
           (42 Numerical/Cat Features)                    (3 Spatial Grids: 11x11)
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                     ┌───────────────────────────────────────────────────┐
                     │      RoNeTC Multi-View Feature Backbone           │
                     │   ├── IP View CNN/MLP        (Dim: 128)           │
                     │   ├── Transport View CNN/MLP (Dim: 128)           │
                     │   └── Payload View CNN/MLP   (Dim: 128)           │
                     └─────────────────────────┬─────────────────────────┘
                                               │
                                               ▼
                     ┌───────────────────────────────────────────────────┐
                     │            Subjective Logic Opinions              │
                     │    Evidence: e_k = Softplus(logits)               │
                     │    Dirichlet: α_k = e_k + 1, S = Σ α_k            │
                     │    Belief: b_k = e_k / S, Uncertainty: u = K / S  │
                     └─────────────────────────┬─────────────────────────┘
                                               │
                                               ▼
                     ┌───────────────────────────────────────────────────┐
                     │      Dempster-Shafer Multi-View Fusion Layer      │
                     │     Produces Fused Belief (b) & Fused u           │
                     └─────────────────────────┬─────────────────────────┘
                                               │
                                               ▼
                                     Is u >= Threshold (τ)?
                                    /                      \
                                   /                        \
                        [ NO: u < τ ]                      [ YES: u >= τ ]
                               │                                  │
                               ▼                                  ▼
                     [ Low Uncertainty ]                [ High Uncertainty ]
                    Confident Prediction:             🚨 FLAGGED AS UNKNOWN (Zero-Day)
                   Normal, DoS, Exploits,                         │
                     Fuzzers, or Generic                          ▼
                                                        [ Latent Embeddings Pool ]
                                                                  │
                                                                  ▼
                                                        [ Novel Class Discovery ]
                                                        K-Means / HDBSCAN (k = 5)
                                                        MITRE ATT&CK Correlation
                                                                  │
                                                                  ▼
                                                     Identified Zero-Day Threats:
                                                      - Cluster 0: Reconnaissance
                                                      - Cluster 1: Backdoor
                                                      - Cluster 2: Shellcode
                                                      - Cluster 3: Analysis
                                                      - Cluster 4: Worms
                                                                  │
                                                                  ▼
                                                  [ Traffic-Restricted Selection ]
                                                  User selects verified traffic risks
                                                                  │
                                                                  ▼
                                                      [ Continual Learning ]
                                                  1. Freeze Multi-View Backbone
                                                  2. Expand Linear Heads (K -> K_new)
                                                  3. Dirichlet Exemplar Fine-Tuning
                                                  4. Zero-Downtime Live Model Hot-Swap
                                                  (0.00% Catastrophic Forgetting)
```

---

## 🖥️ SOC Command Center Modules

NetEvolve features an Apple/Linear-inspired enterprise web console built on **Next.js 16 App Router**, **TypeScript**, and **Tailwind CSS**, communicating with the **FastAPI** backend via REST and WebSockets:

| Module | Purpose & Capabilities |
| :--- | :--- |
| **🌐 Overview Dashboard** | Executive threat posture, live KPI metrics (Total Flows, Known vs. Unknown ratio, Latency), threat category distribution, and recent high-uncertainty security alerts. |
| **⚡ Live Traffic Telemetry** | Real-time WebSocket streaming (`/ws/traffic`) with Dempster-Shafer multi-view evidence inspection (IP, Transport, Payload breakdown), uncertainty gauge meters, and action filtering (Allowed / Suspicious / Blocked). |
| **🛡️ Incident Management** | SOC triage queue with automated incident creation for zero-day flows, uncertainty severity scoring (Critical/High/Medium), deduplicated source IP grouping, and mitigation recommendations. |
| **🔬 Zero-Day Discovery** | Unsupervised latent embedding clustering (K-Means, DBSCAN) with 2D PCA projection scatter plot, cluster purity metrics (Silhouette: `0.4415`, Purity: `77.4%`, NMI: `0.098`), and semantic attack profiling. |
| **🎯 Threat Intelligence** | Automated MITRE ATT&CK mapping (`T1071.001` C2, `T1059` Shellcode, `T1046` Reconnaissance, `T1190` Analysis), targeted protocol monitoring (e.g. TCP/445 SMB), and correlated external adversary host pools. |
| **🧠 Model Observability** | In-depth evidential parameter inspection: view Dirichlet belief distributions, uncertainty histograms, open-set decision threshold ($\tau = 0.1844$), and baseline benchmark metrics. |
| **🧪 Replay Laboratory** | Deterministic security evaluation environment for replaying historical UNSW-NB15 splits with customizable volume, playback speed (1x–10x), zero-day injection ratio, and CSV report export. |
| **💥 Demo Attack Lab** | Interactive zero-day sandbox with 150 pre-calibrated attack seeds (Normal, Backdoor, Analysis, Reconnaissance, Shellcode, Worms) and single-click multi-vector Attack Storm injection. |
| **🔄 Model Evolution** | **Selective Continual Learning:** Displays only the novel risk classes that have actually arrived in traffic so far. Users select which classes to increment, trigger the 7-step pipeline, and can revert to the 5-class baseline at any time. |

---

## 📂 Complete Project Structure

```
NetEvolve/
├── README.md                               # Comprehensive Project Technical Documentation
├── pyproject.toml                          # Project configuration & package build metadata
├── pyrightconfig.json                      # Pyright / IDE strict type checking configuration
├── requirements.txt                        # Strict dependency pinout (PyTorch, FastAPI, Scikit-Learn)
│
├── backend/                                # FastAPI Enterprise Security Gateway
│   ├── main.py                             # API routes, WebSockets (/ws/traffic), CORS, health
│   ├── schemas/                            # Pydantic validation schemas (traffic, incident, discovery, model)
│   ├── services/                           # Inference, simulation, incidents, discovery, continual services
│   └── tests/                              # Automated PyTest API test suite (9 test cases)
│
├── frontend/                               # Next.js 16 App Router TypeScript SOC Console
│   ├── app/                                # Layout, styling, master SOC dashboard page
│   ├── components/                         # Command navbar, Overview, Live Traffic, Demo Lab, Incidents, etc.
│   │   └── views/                          # Modular view components (ModelEvolutionView, ReplayLabView, etc.)
│   ├── hooks/                              # useSocStream WebSocket real-time connection hook
│   ├── lib/                                # Type-safe API client (api.ts)
│   └── types/                              # Strict TypeScript interfaces (soc.ts)
│
├── config/                                 # Centralized Declarative Configurations
│   ├── classes.yaml                        # Partitioning of Known (5) vs. Withheld Zero-Day (5) classes
│   └── config.yaml                         # Global hyperparameters, seeds, view definitions, training configs
│
├── data/                                   # Data Directory & Ingestion Pipelines
│   ├── raw/                                # Original UNSW-NB15 CSV datasets
│   │   ├── UNSW_NB15_training-set.csv      # Train split (175,341 raw flows)
│   │   └── UNSW_NB15_testing-set.csv       # Test split (82,332 raw flows)
│   ├── demo/                               # Demo seed registry
│   │   └── demo_seed_registry.json         # 150 verified attack and normal flow seeds
│   └── processed/                          # Scaled, one-hot encoded, and partitioned arrays
│       ├── X_train.npy                     # Scaled training feature matrix
│       ├── y_train.npy                     # Numerical encoded training labels
│       ├── X_test_known.npy                # Closed-set evaluation test matrix
│       └── multiview/                      # Spliced multi-view tensor partitions (test_known, test_unknown)
│
├── models/                                 # Serialized Checkpoints & Encoders
│   ├── preprocessor.joblib                 # Scikit-learn ColumnTransformer (StandardScaler + OneHotEncoder)
│   ├── label_encoder.joblib                # LabelEncoder mapping string categories to integer IDs
│   ├── baseline/                           # Serialized Random Forest baseline model
│   └── ronetc/                             # RoNeTC+ Core PyTorch Checkpoints
│       ├── best_model.pt                   # Optimal base model weights (5 closed-set classes)
│       └── incremental_model.pt            # Continually updated model weights (7 classes expanded)
│
├── scripts/                                # Command-Line Executable Entrypoints
│   ├── run_data_validation.py              # Validates raw data integrity, nulls, and types
│   ├── run_preprocessing.py                # Executes end-to-end data transformation & splits
│   ├── train_baseline.py                   # Trains and serializes Random Forest benchmark
│   ├── train_ronetc.py                     # Trains base RoNeTC evidential model with Dirichlet loss
│   ├── run_open_set_evaluation.py          # Computes Youden's threshold (τ), AUROC, and uncertainty curves
│   ├── run_novel_class_discovery.py        # Extracts high-uncertainty embeddings & runs K-Means
│   └── run_incremental_update.py           # Expands model heads (5➔7 classes) & tests forgetting
│
├── src/                                    # Modular PyTorch Deep Learning Source Code
│   ├── models/                             # Neural Architectures & Evidential Reasoning
│   │   ├── ronetc_model.py                 # Unified RoNeTC PyTorch classifier module
│   │   ├── global_local_extractor.py       # Multi-view feature extractors (IP, Transport, Payload)
│   │   ├── opinion_generator.py            # Subjective Logic layer computing Dirichlet α, belief, and u
│   │   └── evidence_fusion.py              # Dempster-Shafer evidence fusion across views
│   ├── losses/                             # Evidential Loss Formulations
│   │   └── ronetc_loss.py                  # Sum of Squares Dirichlet Evidential Loss + KL Regularizer
│   ├── discovery/                          # Novel Class Discovery & Unsupervised Clustering
│   │   └── clustering.py                   # High-uncertainty filtering, K-Means, DBSCAN, Silhouette
│   └── incremental/                        # Continual Learning & Catastrophic Forgetting Mitigation
│       └── continual_learner.py            # Head expansion, feature freezing, and exemplar fine-tuning
│
└── tests/                                  # PyTest Automated Unit Test Suite (116 test cases)
```

---

## 🔬 Dataset & Class Partitioning

The system is trained and benchmarked on **UNSW-NB15** (42 flow features). Classes are partitioned into **Known In-Distribution** classes (seen during base model training) and **Withheld Zero-Day Attacks** (completely hidden during training, revealed only during live simulation or evaluation):

| Category Type | Class Label | Network Behavior Profile |
| :--- | :--- | :--- |
| **Known (Trained)** | **Normal** | Legitimate non-malicious background enterprise traffic |
| **Known (Trained)** | **DoS** | High-volume denial of service flooding (SYN flood, UDP blast) |
| **Known (Trained)** | **Exploits** | Known vulnerability exploits targeting unpatched services |
| **Known (Trained)** | **Fuzzers** | Automated protocol and software fuzz testing |
| **Known (Trained)** | **Generic** | Generic block-cipher collision and cryptographic attacks |
| **Zero-Day (Withheld)** | **Analysis** | Web vulnerability scanning, directory traversal (`../`), fuzzing |
| **Zero-Day (Withheld)** | **Backdoor** | Stealthy periodic command-and-control (C2) heartbeat beacons |
| **Zero-Day (Withheld)** | **Reconnaissance** | Horizontal port scanning, SYN sweeps, and ICMP host probing |
| **Zero-Day (Withheld)** | **Shellcode** | In-memory exploit injection targeting buffer overflows |
| **Zero-Day (Withheld)** | **Worms** | Self-propagating lateral movement attempts across subnets |

### Feature-to-View Partitioning
The 42 raw flow features are partitioned into 3 domain-specific complementary views:
1. **IP View (9 features):** Connection duration, source/destination bytes, TTL, packet loss, and source/destination load.
2. **Transport View (7 features):** Source/destination port, protocol, service, TCP state, and connection-source count statistics.
3. **Payload / Traffic Pattern View (6 features):** Packet counts, mean packet sizes, HTTP methods, and TCP window attributes.

---

## 📊 Empirical Results & Performance Benchmarks

### 1. Closed-Set Classification Performance ($N = 77,154$)

| Model Architecture | Accuracy | Macro F1 | Weighted F1 | Parameter Count |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest Baseline** | **79.13%** | **0.6952** | **0.8140** | 100 Trees (depth: 20) |
| **Neural Network (MLP)** | **75.25%** | **0.6648** | **0.7820** | 44,421 parameters |
| **RoNeTC+ (Multi-View Fused)** | **78.40%** | **0.6890** | **0.8095** | 186,240 parameters |

### 2. Open-Set Zero-Day Detection
* **Optimal Decision Threshold ($\tau$ via Youden's Index):** **`0.1844`**
* **Known Class Retention Rate (TPR):** **`99.12%`**
* **Unknown Zero-Day Detection Rate (TNR):** **`98.40%`**
* **Open-Set AUROC:** **`98.45%`**

### 3. Novel Class Discovery (Latent Space Clustering)
* **Cluster Purity:** **`77.40%`**
* **Silhouette Coefficient:** **`0.4415`** (strong geometric cluster separation in latent space)
* **Normalized Mutual Information (NMI):** **`0.0979`**
* **Adjusted Rand Index (ARI):** **`0.0456`**

### 4. Continual Learning & Catastrophic Forgetting
Stress-testing the expanded model ($5 \to 7$ classes, adding `Analysis` and `Backdoor`) under varying supervisory label noise ($\eta$):

| Label Noise ($\eta$) | Historical Classes Accuracy | Discovered Classes Accuracy | Catastrophic Forgetting Rate |
| :---: | :---: | :---: | :---: |
| **0% (Clean)** | **74.00%** | **53.00%** | **0.00%** |
| **5% Noise** | **73.80%** | **51.20%** | **0.27%** |
| **10% Noise** | **72.38%** | **48.60%** | **1.62%** |

---

## 🚀 Installation & Getting Started

### Prerequisites
* **Operating System:** macOS (Apple Silicon / Intel), Linux, or Windows (WSL2 recommended)
* **Python:** 3.10 or 3.11
* **Node.js:** 18+ or 20+
* **Hardware:** 8 GB+ RAM

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/AbhinavKotagi/NetEvolve.git
cd NetEvolve

# Create virtual environment & activate
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
```

### 2. Set Up Frontend
```bash
cd frontend
npm install
cd ..
```

### 3. Run the Platform

Open two terminal windows:

**Terminal 1 — FastAPI Security Gateway:**
```bash
# Starts gateway on http://localhost:8000
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Next.js SOC Dashboard:**
```bash
cd frontend
npm run dev -- -p 3000
```

Open **`http://localhost:3000`** in your browser to access the full enterprise console.

---

## 🔌 Core API Reference

The FastAPI gateway exposes REST and WebSocket endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/model/info` | Current RoNeTC+ model architecture, active classes, and benchmarks. |
| `GET` | `/api/traffic/live` | Recent flow history from the 500-event ring buffer. |
| `WS` | `/ws/traffic` | WebSocket bi-directional live traffic streaming and simulation control. |
| `GET` | `/api/metrics` | Real-time SOC KPIs, threat distribution, and uncertainty histograms. |
| `GET` | `/api/demo/seeds` | Registry of 150 pre-calibrated attack and normal flow seeds. |
| `POST` | `/api/demo/seeds/{id}/run` | Injects a specific seed attack flow into the live gateway stream. |
| `GET` | `/api/incidents` | Lists active security incidents tagged by uncertainty severity. |
| `PATCH` | `/api/incidents/{id}` | Updates incident status (`INVESTIGATING`, `CONTAINED`, `RESOLVED`). |
| `GET` | `/api/discovery/clusters` | Returns 2D PCA cluster projection points, purity metrics, and attack profiles. |
| `POST` | `/api/discovery/run` | Re-runs unsupervised clustering with custom algorithm or cluster count ($k$). |
| `GET` | `/api/continual-learning/candidates` | Returns novel threat classes observed in traffic so far for selective expansion. |
| `POST` | `/api/continual-learning/start` | Triggers dynamic head expansion and fine-tuning for selected threat classes. |
| `POST` | `/api/continual-learning/reset` | Atomically resets the live model back to the 5-class baseline checkpoint. |

---

## 🧪 Testing & Verification

NetEvolve includes 125 automated unit and integration tests across the deep learning model, data pipeline, and API gateway:

```bash
# Run the full test suite (125 tests)
pytest tests/ backend/tests/ -v

# Run type checking on frontend
cd frontend && npx tsc --noEmit
```

**Test Coverage:**
* `test_models.py`: Multi-view forward pass, embedding extraction, and output shapes.
* `test_opinion_generator.py`: Non-negative evidence ($e_k \ge 0$), belief constraint ($\sum b_k + u = 1.0$).
* `test_evidence_fusion.py`: Dempster-Shafer associative multi-view combination and numerical stability clamping.
* `test_ronetc_loss.py`: Evidential Dirichlet loss and KL annealing regularization.
* `test_open_set_evaluation.py`: Youden's Index threshold calculation and rejection masking.
* `test_clustering.py`: Latent feature cluster purity, Silhouette score, and NMI.
* `test_incremental_learning.py`: Parameter gradient freezing (`requires_grad == False`), dynamic head expansion, and forgetting rate.
* `test_api.py`: FastAPI health, seeds registry, live injection, incident lifecycle, discovery runs, and traffic-restricted continual learning candidate selection.

---

## 📜 Mathematical Reference: Subjective Logic & Evidential Loss

For a $K$-class classification problem:

### 1. Belief Masses and Dirichlet Uncertainty
Given non-negative evidence vectors $\mathbf{e} = [e_1, \dots, e_K]^T \ge 0$ generated via Softplus:
$$\alpha_k = e_k + 1, \quad S = \sum_{k=1}^K \alpha_k, \quad b_k = \frac{e_k}{S}, \quad u = \frac{K}{S}$$

Satisfying the fundamental Subjective Logic identity:
$$u + \sum_{k=1}^K b_k = \frac{K}{S} + \sum_{k=1}^K \frac{e_k}{S} = \frac{K + \sum e_k}{S} = \frac{S}{S} = 1.0$$

### 2. Dempster's Rule of Combination (Multi-View Fusion)
Combining opinions $\omega_1 = (\{b_k^1\}, u^1)$ and $\omega_2 = (\{b_k^2\}, u^2)$ across two views:
$$b_k^{\text{fused}} = \frac{b_k^1 b_k^2 + b_k^1 u^2 + b_k^2 u^1}{1 - C}, \quad u^{\text{fused}} = \frac{u^1 u^2}{1 - C}$$
where conflict factor $C = \sum_{i \neq j} b_i^1 b_j^2$.

### 3. Evidential Training Loss
$$\mathcal{L}(\alpha, \mathbf{y}) = \sum_{k=1}^K \left( y_k - \frac{\alpha_k}{S} \right)^2 + \frac{\alpha_k(S - \alpha_k)}{S^2(S+1)} + \lambda_t \cdot \mathrm{KL}\Big[\mathrm{Dir}(\mathbf{p} \mid \tilde{\alpha}) \parallel \mathrm{Dir}(\mathbf{p} \mid \mathbf{1})\Big]$$
where $\tilde{\alpha}_k = y_k + (1 - y_k)\alpha_k$ removes ground-truth evidence to penalize misleading evidence, and $\lambda_t = \min\left(1.0, \frac{t}{\text{annealing\_epochs}}\right)$.

---

## 👥 Authors & Acknowledgments
* **Project Name:** NetEvolve (RoNeTC+)
* **Dataset:** UNSW-NB15 provided by the Cyber Range Lab of UNSW Canberra.
* **Core Technologies:** PyTorch, FastAPI, Next.js, Scikit-Learn, Tailwind CSS.

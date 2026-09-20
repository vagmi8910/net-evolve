# NetEvolve: RoNeTC+ Multi-View Evidential Network Traffic Classification & Continual Zero-Day Discovery

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![PyTorch 2.4](https://img.shields.io/badge/PyTorch-2.4-EE4C2C.svg)](https://pytorch.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-FF4B4B.svg)](https://streamlit.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Dataset: UNSW-NB15](https://img.shields.io/badge/Dataset-UNSW--NB15-brightgreen.svg)](https://research.unsw.edu.au/projects/unsw-nb15-dataset)

---

## 📌 Executive Summary

**NetEvolve** is an end-to-end framework implementing **RoNeTC+** (*Robust Network Traffic Classifier Plus*), an adaptive open-set network intrusion detection and continual learning system. 

Traditional Machine Learning and Deep Learning Network Intrusion Detection Systems (NIDS)—such as Random Forests and multi-layer perceptrons—operate under a closed-world assumption: they force every incoming flow into a predefined set of known categories. When exposed to unseen zero-day attacks or novel cyber-threats, legacy classifiers assign arbitrary labels with dangerously high confidence.

**RoNeTC+** addresses this vulnerability by uniting:
1. **Multi-View Domain Feature Splicing** (IP, Transport, and Traffic Pattern views),
2. **Evidential Deep Learning (Subjective Logic)** to quantify second-order Dirichlet uncertainty ($u = K / S$),
3. **Dempster-Shafer Multi-View Evidence Fusion**,
4. **Open-Set Zero-Day Rejection** via Youden's Index optimal thresholding ($\tau$),
5. **Novel Class Discovery (NCD)** via latent embedding clustering, and
6. **Class-Incremental Learning** with backbone feature freezing to integrate newly discovered zero-days with **0% catastrophic forgetting** of historical traffic.

---

## 🔄 End-to-End System Pipeline

```
                              [ Incoming Network Traffic Flow ]
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
             [ Flow Normalizer ]                             [ Multi-View Splicer ]
                      │                                               │
                      ▼                                               ▼
          [ 42 Tabular Features ]                        [ Spliced Tensor (12, 11, 11) ]
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
                    │        Produces Fused Belief & Fused u            │
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
                                                       K-Means / HDBSCAN Clustering
                                                                 │
                                                                 ▼
                                                    Identified Zero-Day Threat:
                                                      Cluster 1: Backdoor
                                                      Cluster 2: Analysis
                                                                 │
                                                                 ▼
                                                       [ Continual Learning ]
                                                    - Freeze Feature Backbone
                                                    - Expand Head: 5 ➔ 7 classes
                                                    - Fast Fine-Tuning (0% Forgetting)
```

---

## 📂 Complete Project Folder Structure

```
NetEvolve/
├── README.md                               # Comprehensive Project Technical Documentation
├── RoNeTC_Plus_Project_Technical_Report.pdf# Full IEEE-formatted Project Report & Empirical Analysis
├── pyproject.toml                          # Project configuration & package build metadata
├── requirements.txt                        # Strict dependency pinout (PyTorch, Scikit-Learn, Streamlit, etc.)
│
├── backend/                                # FastAPI Enterprise Security Gateway
│   ├── main.py                             # API routing, WebSockets (/ws/traffic), CORS, health
│   ├── schemas/                            # Pydantic schemas (traffic, incident, discovery, model)
│   ├── services/                           # Inference, simulation, incidents, discovery, continual services
│   └── tests/                              # Automated PyTest API test suite
│
├── frontend/                               # Next.js 16 App Router TypeScript SOC Console
│   ├── app/                                # Layout, styling, master SOC dashboard page
│   ├── components/                         # Command navbar, Overview, Live Traffic, Demo Lab, Incidents, etc.
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
│   │   ├── UNSW_NB15_testing-set.csv       # Test split (82,332 raw flows)
│   │   └── README.md                       # Data dictionary & column descriptions
│   ├── interim/                            # Intermediate cleaned flow batches
│   └── processed/                          # Scaled, one-hot encoded, and partitioned arrays
│       ├── X_train.npy                     # Scaled training feature matrix
│       ├── y_train.npy                     # Numerical encoded training labels
│       ├── X_val.npy                       # Validation feature matrix
│       ├── y_val.npy                       # Validation encoded labels
│       ├── X_test_known.npy                # Closed-set evaluation test matrix
│       ├── y_test_known.npy                # Closed-set test labels
│       ├── multiview/                      # Spliced multi-view tensor partitions
│       └── processed_metadata.json         # Dataset transformation shapes and statistics
│
├── models/                                 # Serialized Checkpoints & Encoders
│   ├── preprocessor.joblib                 # Scikit-learn ColumnTransformer (StandardScaler + OneHotEncoder)
│   ├── label_encoder.joblib                # LabelEncoder mapping string categories to integer IDs
│   ├── baseline/                           # Serialized Random Forest baseline model
│   ├── neural/                             # Latent embedding baseline neural network
│   │   └── model_metadata.json             # Baseline model architecture metadata
│   └── ronetc/                             # RoNeTC+ Core PyTorch Checkpoints
│       ├── best_model.pt                   # Optimal base model weights (5 closed-set classes)
│       └── incremental_model.pt            # Continually updated model weights (7 classes expanded)
│
├── results/                                # Empirical Artifacts & Benchmarks
│   ├── figures/                            # Confusion matrices and learning trajectories
│   │   ├── baseline_confusion_matrix_test.png
│   │   ├── baseline_confusion_matrix_val.png
│   │   ├── neural_accuracy_curve.png
│   │   ├── neural_confusion_matrix_test.png
│   │   ├── neural_confusion_matrix_val.png
│   │   └── neural_loss_curve.png
│   ├── metrics/                            # Quantitative benchmark logs in JSON
│   │   ├── baseline_metrics.json           # Random Forest precision, recall, F1, accuracy
│   │   ├── neural_metrics.json             # Neural MLP precision, recall, F1, accuracy
│   │   ├── model_comparison.json          # Consolidated model comparison metrics
│   │   └── training_history.json           # Epoch-by-epoch loss and validation metrics
│   ├── plots/                              # Open-set uncertainty distributions
│   │   └── uncertainty_distribution.png    # Known vs. Unknown KDE separation plot
│   └── reports/                            # Detailed audit and stage verification reports
│       ├── class_configuration_report.json # Mapping and verification of split classes
│       ├── data_validation_report.txt      # Missing value & leakage sanity check
│       ├── extractor_smoke_test_report.json# Multi-view forward-pass verification
│       ├── multiview_preprocessing_report.json
│       ├── open_set_evaluation_report.json # Youden's Index, AUROC, TPR, TNR
│       ├── novel_discovery_report.json     # NMI, ARI, Purity, Silhouette cluster metrics
│       ├── incremental_learning_report.json# Forgetting rate & noise stress-testing
│       └── ronetc_training_report.json     # Training time, convergence, and calibration
│
├── scripts/                                # Command-Line Executable Entrypoints
│   ├── run_data_validation.py              # Validates raw data integrity, nulls, and types
│   ├── run_preprocessing.py                # Executes end-to-end data transformation & train/val/test splits
│   ├── run_dataset_adapter.py              # Bridges tabular flows to multi-view spliced packet structures
│   ├── run_extractor_smoke_test.py         # Validates multi-view feature extractor shape integrity
│   ├── train_baseline.py                   # Trains and serializes Random Forest benchmark
│   ├── train_neural_model.py               # Trains closed-set MLP baseline with embedding head
│   ├── train_ronetc.py                     # Trains base RoNeTC evidential model with Dirichlet loss
│   ├── run_open_set_evaluation.py          # Computes Youden's threshold (τ), AUROC, and uncertainty curves
│   ├── run_novel_class_discovery.py        # Extracts high-uncertainty embeddings & runs K-Means clustering
│   ├── run_incremental_update.py           # Expands model heads (5➔7 classes) & tests forgetting
│   ├── evaluate_model.py                   # General model evaluation script across metrics
│   ├── run_pcap_ingestion.py               # Live / offline PCAP packet reader and flow extractor
│   └── generate_pdf_report.py              # Automated ReportLab PDF generator producing technical report
│
├── src/                                    # Modular Source Codebase
│   ├── __init__.py
│   ├── main.py                             # Central CLI dispatcher for all project stages
│   │
│   ├── dashboard/                          # Interactive User Interface
│   │   └── app.py                          # 5-Stage Streamlit Dashboard with live zero-day sandbox
│   │
│   ├── data/                               # Dataset Abstractions & Packet Processors
│   │   ├── dataset.py                      # PyTorch Dataset abstractions for tabular flow features
│   │   ├── flow.py                         # Flow record schema and feature definitions
│   │   ├── loader.py                       # Batched DataLoaders with stratified sampling
│   │   ├── multiview_dataset.py            # PyTorch Dataset returning 3 distinct views per flow
│   │   ├── pcap_reader.py                  # Scapy/DPKT packet capture ingestion engine
│   │   └── validation.py                   # Schema verification, column checks, and sanity guards
│   │
│   ├── preprocessing/                      # Data Transformation & View Encoding
│   │   ├── cleaner.py                      # Handling missing values, duplicates, and infinite values
│   │   ├── dataset_adapter.py              # Maps 42 tabular features into IP, Transport, and Payload views
│   │   ├── feature_processor.py            # ColumnTransformer applying StandardScaler and OneHotEncoder
│   │   ├── label_processor.py              # Splits dataset into known training vs withheld zero-day pools
│   │   ├── multiview_preprocessor.py       # Multi-view tensor transformation coordinator
│   │   ├── preprocessing_pipeline.py       # End-to-end pipeline runner
│   │   └── view_encoder.py                 # Dimensionality and tensor reshaping for view extractors
│   │
│   ├── models/                             # Neural Architectures & Evidential Reasoning
│   │   ├── baseline.py                     # Random Forest baseline implementation
│   │   ├── neural_network.py               # Deep MLP classifier with intermediate embedding layer
│   │   ├── model_factory.py                # Factory instantiation helper for models and optimizers
│   │   ├── packet_splice.py                # Packet splicing logic: sliding window tensor grouping
│   │   ├── global_local_extractor.py       # Multi-view feature extractors (IP, Transport, Payload)
│   │   ├── opinion_generator.py            # Subjective Logic layer computing Dirichlet α, belief, and u
│   │   ├── evidence_fusion.py              # Dempster-Shafer evidence fusion across views
│   │   ├── ronetc_model.py                 # Unified RoNeTC PyTorch module with head expansion
│   │   ├── ronetc_trainer.py               # Training loop with KL divergence annealing & early stopping
│   │   └── trainer.py                      # Baseline trainer for standard neural network
│   │
│   ├── losses/                             # Evidential Loss Formulations
│   │   └── ronetc_loss.py                  # Sum of Squares Dirichlet Evidential Loss + KL Regularizer
│   │
│   ├── evaluation/                         # Benchmarking & Open-Set Metrics
│   │   ├── evaluator.py                    # Multi-class accuracy, precision, recall, and macro F1
│   │   ├── metrics.py                      # Macro and weighted F1-score utilities
│   │   ├── open_set_evaluator.py           # Youden's Index threshold calculation & open-set rejection
│   │   ├── open_set_visualization.py       # KDE density distribution plotting (Known vs. Unknown)
│   │   └── visualization.py                # Confusion matrix, ROC, and loss curve plotting utilities
│   │
│   ├── discovery/                          # Novel Class Discovery & Unsupervised Clustering
│   │   └── clustering.py                   # High-uncertainty sample filtering, K-Means, DBSCAN, Silhouette
│   │
│   ├── incremental/                        # Continual Learning & Catastrophic Forgetting Mitigation
│   │   └── continual_learner.py            # Head expansion, feature freezing, and exemplar fine-tuning
│   │
│   └── utils/                              # Shared Helpers & System Configuration
│       ├── config.py                       # YAML configuration loader with dot-notation access
│       ├── logger.py                       # Standardized structured console and file logger
│       ├── paths.py                        # Pathlib resolution for all project directories
│       └── seed.py                         # Deterministic random seed enforcement (Torch, Numpy, Random)
│
└── tests/                                  # PyTest Automated Unit & Integration Test Suite
    ├── test_preprocessing.py               # Tests data cleaning, one-hot encoding, and scaling
    ├── test_loader.py                      # Tests DataLoader shapes and batch integrity
    ├── test_flow_preprocessing.py          # Tests flow serialization and feature alignment
    ├── test_models.py                      # Tests baseline Random Forest and neural network forward pass
    ├── test_packet_splice.py               # Tests packet splicing tensor dimensions (12, 11, 11)
    ├── test_global_local_extractor.py      # Tests multi-view extractors output shapes (128-dim per view)
    ├── test_opinion_generator.py           # Tests Dirichlet parameter derivation (α >= 1, u in [0, 1])
    ├── test_evidence_fusion.py             # Tests Dempster-Shafer combination associativity and clamp
    ├── test_ronetc_loss.py                 # Tests EDL loss computation and KL annealing factor
    ├── test_ronetc_model.py                # Tests end-to-end forward pass and class expansion
    ├── test_open_set_evaluation.py         # Tests Youden thresholding and open-set rejection logic
    ├── test_clustering.py                  # Tests K-Means clustering and evaluation metrics (Purity, ARI)
    └── test_incremental_learning.py        # Tests feature freezing, head expansion, and forgetting rate
```

---

## 🔬 Dataset & Class Partitioning

The system is evaluated on the benchmark **UNSW-NB15** dataset containing 42 numerical and categorical flow features. To simulate true zero-day cyber-attacks in a controlled open-set research environment, classes are partitioned into **Known Classes** (seen during base training) and **Withheld Novel Attacks** (completely hidden during training, revealed only during open-set evaluation):

| Category Type | Class Label | Role in Project Pipeline |
| :--- | :--- | :--- |
| **Known (Trained)** | **Normal** | Legitimate non-malicious background traffic |
| **Known (Trained)** | **DoS** | Denial of Service flooding attacks |
| **Known (Trained)** | **Exploits** | Known vulnerability exploit payloads |
| **Known (Trained)** | **Fuzzers** | Automated protocol and software fuzz testing |
| **Known (Trained)** | **Generic** | Cryptographic and generic collision attacks |
| **Novel Zero-Day (Withheld)** | **Analysis** | Port sweeps, web vulnerability scanning, directory traversal |
| **Novel Zero-Day (Withheld)** | **Backdoor** | Stealthy command-and-control (C2) heartbeat beacons |
| **Novel Zero-Day (Withheld)** | **Reconnaissance** | Host discovery, ICMP sweeps, and OS fingerprinting |
| **Novel Zero-Day (Withheld)** | **Shellcode** | Memory-injected executable machine-code payloads |
| **Novel Zero-Day (Withheld)** | **Worms** | Self-replicating autonomous propagation attacks |

### Feature-to-View Partitioning
The 42 raw flow features are partitioned into 3 domain-specific complementary views:
1. **IP View (9 features):** Connection duration, source/destination bytes, TTL, packet loss, and source/destination load.
2. **Transport View (7 features):** Source/destination port, protocol, service, TCP state, and connection-source count statistics.
3. **Payload / Traffic Pattern View (6 features):** Packet counts, mean packet sizes, HTTP methods, and TCP window attributes.

---

## 📊 Empirical Results & Performance Benchmarks

### 1. Closed-Set Classification Performance ($N = 77,154$)

Evaluated on the closed-set test split of known traffic:

| Model Architecture | Accuracy | Macro F1 | Weighted F1 | Parameter Count |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest Baseline** | **79.13%** | **0.6952** | **0.8140** | 100 Trees (depth: 20) |
| **Neural Network (MLP)** | **75.25%** | **0.6648** | **0.7820** | 44,421 parameters |
| **RoNeTC (Multi-View Fused)** | **78.40%** | **0.6890** | **0.8095** | 186,240 parameters |

*Per-Class Performance of Baseline:*
* **Normal:** Precision = 0.88, Recall = 0.76, F1 = 0.82 (Support = 4,089)
* **DoS:** Precision = 0.84, Recall = 0.78, F1 = 0.81 (Support = 11,132)
* **Exploits:** Precision = 0.69, Recall = 0.58, F1 = 0.63 (Support = 6,062)
* **Fuzzers:** Precision = 0.71, Recall = 0.67, F1 = 0.69 (Support = 18,871)
* **Generic:** Precision = 0.96, Recall = 0.98, F1 = 0.97 (Support = 37,000)

### 2. Open-Set Zero-Day Detection

* **Optimal Uncertainty Threshold ($\tau$ via Youden's Index):** **`0.1844`** (Default interactive sensitivity: `0.5200`)
* **Known Class Retention Rate (TPR):** **99.12%**
* **Unknown Zero-Day Detection Rate (TNR):** **98.40%**
* **Open-Set AUROC:** **`98.45%`**

### 3. Novel Class Discovery (Latent Space Clustering)

High-uncertainty flows ($u \ge \tau$) grouped by K-Means ($k=5$):

* **Cluster Purity:** **`77.40%`**
* **Silhouette Coefficient:** **`0.4415`**
* **Normalized Mutual Information (NMI):** **`0.0979`**
* **Adjusted Rand Index (ARI):** **`0.0456`**

### 4. Continual Learning & Catastrophic Forgetting

Stress-testing the incrementally expanded model ($5 \to 7$ classes, adding `Analysis` and `Backdoor`) under varying supervisory label noise ($\eta$):

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
* **Hardware:** 8 GB+ RAM (16 GB recommended for full UNSW-NB15 dataset)

### 1. Clone & Set Up Environment
```bash
git clone https://github.com/AbhinavKotagi/NetEvolve.git
cd NetEvolve

# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install package in editable mode
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
```

### 2. Run Data Preprocessing & Validation
```bash
# Validate raw dataset integrity
python scripts/run_data_validation.py

# Execute full preprocessing & multi-view dataset creation
python scripts/run_preprocessing.py
```

### 3. Train Models
```bash
# Train Random Forest baseline
python scripts/train_baseline.py

# Train baseline neural network
python scripts/train_neural_model.py

# Train RoNeTC multi-view evidential model
python scripts/train_ronetc.py
```

### 4. Evaluate Open-Set & Continual Learning
```bash
# Compute Youden threshold and open-set uncertainty curves
python scripts/run_open_set_evaluation.py

# Run novel class discovery on rejected zero-day flows
python scripts/run_novel_class_discovery.py

# Perform continual head expansion (5 -> 7 classes)
python scripts/run_incremental_update.py
```

### 5. Launch the Enterprise SOC Command Center (FastAPI + Next.js)

```bash
# Terminal 1: Launch FastAPI Security Gateway (port 8000)
source .venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Launch Next.js Enterprise SOC Dashboard (port 3000)
cd frontend
npm run start -- -p 3000   # (or `npm run dev -- -p 3000` for development)
```
Open your browser at `http://localhost:3000/` to access the full enterprise command center.

### 6. Launch the Research Streamlit Dashboard (Alternative)
```bash
streamlit run src/dashboard/app.py
```
Open your browser at `http://localhost:8501/` to access the 5-stage research prototype.

### 7. Generate the Full PDF Technical Report
```bash
python scripts/generate_pdf_report.py
```
This generates `RoNeTC_Plus_Project_Technical_Report.pdf` in the project root.

---

## 🖥️ Interactive Dashboard Walkthrough

The Streamlit dashboard (`src/dashboard/app.py`) provides an executive presentation interface organized into 5 stages:

1. **Stage 1: Overview & Architecture**  
   Interactive architecture diagram, problem formulation, and theoretical foundations of Evidential Deep Learning (Subjective Logic).
2. **Stage 2: Closed-Set Benchmarks**  
   Direct quantitative comparison of Random Forest vs. Neural Network baselines, complete with confusion matrices and per-class precision/recall tables.
3. **Stage 3: Open-Set Uncertainty (RoNeTC)**  
   Interactive Youden's Index slider ($\hat{\sigma}$), real-time density distribution curves showing the clean separation between known traffic and novel attacks, and AUROC metrics.
4. **Stage 4: Novel Class Discovery (RoNeTC+)**  
   Latent 2D PCA cluster visualization of high-uncertainty zero-day attacks, candidate cluster selection ($k \in [3, 6]$), algorithm comparisons (K-Means vs. DBSCAN vs. HDBSCAN), and semantic attack profiling.
5. **Stage 5: Live Demo: Zero-Day ➔ Continual Learning**  
   * **Live Stream Simulation:** Send individual or multi-packet batches through the live firewall.
   * **Interactive Zero-Day Rejection:** Experience real-time rejection of unknown attacks with visual gauge meters.
   * **On-the-Fly Model Expansion:** Trigger the 3-step incremental update in the UI and watch the model instantly learn the new attack category with 0% catastrophic forgetting.

---

## 🧪 Testing & Verification

The project includes 13 comprehensive pytest test suites covering every component of the pipeline:

```bash
pytest tests/ -v
```

**Test Coverage Highlights:**
* `test_preprocessing.py`: Feature scaling, categorical encoding, and zero data leakage.
* `test_packet_splice.py`: Spliced tensor dimension correctness $(12, 11, 11)$.
* `test_opinion_generator.py`: Non-negative evidence ($e_k \ge 0$) and valid uncertainty ($u \in [0, 1]$).
* `test_evidence_fusion.py`: Dempster-Shafer associative combination and numerical stability clamping.
* `test_ronetc_loss.py`: Evidential mean squared error and dynamic KL divergence annealing factor.
* `test_open_set_evaluation.py`: Youden's Index threshold calculation and rejection masking.
* `test_clustering.py`: Latent feature cluster purity and metric computation.
* `test_incremental_learning.py`: Parameter gradient freezing (`requires_grad == False`), weight expansion, and historical accuracy retention.

---

## 📜 Mathematical Reference: Subjective Logic & Evidential Loss

In RoNeTC+, for a $K$-class classification problem:

1. **Belief Masses and Vacuity (Uncertainty):**
   Given non-negative evidence vectors $\mathbf{e} = [e_1, \dots, e_K]^T \ge 0$ generated via Softplus:
   $$\alpha_k = e_k + 1, \quad S = \sum_{k=1}^K \alpha_k, \quad b_k = \frac{e_k}{S}, \quad u = \frac{K}{S}$$
   Satisfying the Subjective Logic constraint:
   $$u + \sum_{k=1}^K b_k = \frac{K}{S} + \sum_{k=1}^K \frac{e_k}{S} = \frac{K + \sum e_k}{S} = \frac{S}{S} = 1$$

2. **Dempster's Rule of Combination (Multi-View Fusion):**
   Combining two views with opinions $\omega_1 = (\{b_k^1\}, u^1)$ and $\omega_2 = (\{b_k^2\}, u^2)$:
   $$b_k^{\text{fused}} = \frac{b_k^1 b_k^2 + b_k^1 u^2 + b_k^2 u^1}{1 - C}, \quad u^{\text{fused}} = \frac{u^1 u^2}{1 - C}$$
   where the conflict factor $C = \sum_{i \neq j} b_i^1 b_j^2$.

3. **Evidential Training Loss:**
   $$\mathcal{L}(\alpha, \mathbf{y}) = \sum_{k=1}^K \left( y_k - \frac{\alpha_k}{S} \right)^2 + \frac{\alpha_k(S - \alpha_k)}{S^2(S+1)} + \lambda_t \cdot \mathrm{KL}\Big[\mathrm{Dir}(\mathbf{p} \mid \tilde{\alpha}) \parallel \mathrm{Dir}(\mathbf{p} \mid \mathbf{1})\Big]$$
   where $\tilde{\alpha}_k = y_k + (1 - y_k)\alpha_k$ removes ground-truth evidence to penalize misleading evidence, and $\lambda_t = \min\left(1.0, \frac{t}{\text{annealing\_epochs}}\right)$.

---

## 👥 Authors & Acknowledgments
* **Project Name:** NetEvolve (RoNeTC+)
* **Dataset:** UNSW-NB15 provided by the Cyber Range Lab of UNSW Canberra.
* **Core Technologies:** PyTorch, Scikit-Learn, Streamlit, Matplotlib, Seaborn, ReportLab.

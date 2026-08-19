# Side Face Detection Using Computer Vision and Deep Learning
**Project: CIPHERGATE**

## 1. Project Title
**Side Face Detection and Biometric Logging Using Computer Vision and Deep Learning**

### Objective
To detect and identify human faces captured from **side/profile views**, where traditional frontal face detection methods may fail, and securely log these biometric telemetry events into a centralized database for threat detection and attendance tracking.

---

## 2. What is Side Face Detection?
Side face detection is the process of detecting a human face when the person is looking **left or right**, rather than directly toward the camera.

There are three common views:
* **Frontal face** – person looks directly at the camera
* **Left profile** – person looks toward the left
* **Right profile** – person looks toward the right

---

## 3. Problem Statement
Most traditional face detection systems are optimized for **frontal faces**. Their performance can decrease when:
* The face is rotated or looking sideways
* Only part of the face is visible
* Lighting conditions change or the face is partially occluded
* The image has low resolution

Therefore, a robust system like **CIPHERGATE**, specifically designed for **profile/side-face detection** coupled with advanced tracking, is required to ensure no blind spots in security monitoring.

---

## 4. Why Side Face Detection is Important?
Side face detection can be useful in:
* **Surveillance & Security Systems** (e.g., detecting intruders approaching at an angle)
* **Attendance Systems** (Track attendance just by looking, without needing to stop and face a camera)
* **Threat & Intrusion Detection**
* Smart cameras and drone-based surveillance
* Forensic applications and human activity analysis

---

## 5. Core Concepts

### A. Computer Vision
Computer vision allows computers to understand and analyze images and videos. In this project, it is used to process video streams, extract facial features, and detect threats in real-time.

### B. Image Preprocessing
Before detecting a face, the input image is processed to improve detection.
Common techniques used: Image resizing, Grayscale conversion, Noise removal, and Histogram equalization.

### C. Face Detection & Pose Estimation
Face detection determines: **"Where is the face in the image?"**
Our implementation goes a step further by using **Pose Estimation (YOLOv8-Pose)** to understand the orientation of the head and body, allowing highly accurate detection even at extreme side profiles.

### D. Profile Face Detection Features
Important features extracted include:
* Forehead, Nose projection, Lips, Chin, Jawline, and Ear placement.
* Our heuristic engine also maps: Skin tone, Eye color, Distinctive marks, Scars, and Facial hair.

---

## 6. Detection Approaches

### 1. Haar Cascade / HOG
Traditional computer-vision-based detection methods that rely on edges and gradients. They are fast but sensitive to lighting and extreme poses.

### 2. CNN – Convolutional Neural Network
CNNs automatically learn visual features from images, providing better robustness than traditional hand-crafted feature methods.

### 3. YOLO (You Only Look Once) - *[Implemented in CIPHERGATE]*
An advanced object-detection approach that can detect faces and poses in real-time.
* Our backend utilizes `yolov8n-pose.pt` for ultra-fast, high-confidence detection.
* It provides bounding boxes, class labels, keypoints (for pose), and confidence scores.

---

## 7. Dataset & Preparation

The system relies on high-quality datasets consisting of:
* Left-profile and Right-profile images.
* Variations in lighting, backgrounds, and face angles.
* Datasets are managed via our `project dataset/` and `known_faces/` directories.

**Data Augmentation:** Techniques like horizontal flipping, rotation, scaling, and brightness adjustment are used to make the model robust to real-world conditions.

---

## 8. Feature Extraction & Profile Localization

For a side face, features are extracted dynamically. The system determines the face coordinates:
`(x, y)` → Top-left corner
`(w, h)` → Width and height

To handle opposite profile directions efficiently, horizontal flipping and mirrored landmark orientation estimation are utilized.

---

## 9. Evaluation Metrics & Confusion Matrix

* **Accuracy**: How many predictions are correct.
* **Precision**: How many detected faces are actually faces.
* **Recall**: How many actual faces were successfully detected.
* **F1-Score**: Balances precision and recall.

|                  | Predicted Side Face | Predicted Non-Face |
| ---------------- | ------------------: | -----------------: |
| Actual Side Face |       True Positive |     False Negative |
| Actual Non-Face  |      False Positive |      True Negative |

---

## 10. Real-Time Detection & API Integration

Our system is built for real-time web deployment:
1. **Webcam Capture** via React Frontend.
2. **REST API Post** (`/api/detect`) to the Flask/Python Backend.
3. **YOLO/Heuristic Processing** for profile detection.
4. **Database Matching** using Neon Serverless PostgreSQL.
5. **Dashboard Render** of the Bounding Box, Confidence Score, and Log.

---

## 11. Technologies Used (Full Stack)

Unlike traditional scripts, this project is a fully deployed application:

| Category        | Technology                                      | Purpose                                           |
| --------------- | ----------------------------------------------- | ------------------------------------------------- |
| **Frontend**    | React, React Router 7, Tailwind CSS, Vite       | Operator Dashboard, UI, and Biometric Scanner     |
| **Mobile**      | React Native, Expo                              | Mobile Companion App                              |
| **Backend API** | Node.js, Hono, Flask (Python)                   | Routing requests and serving CV models            |
| **Database**    | Neon PostgreSQL / SQLite                        | Storing `face_profiles` and `detection_logs`      |
| **CV Models**   | YOLOv8-Pose, OpenCV, MediaPipe                  | Real-time object and pose detection               |
| **AI Fallback** | Gemini API (Vision)                             | Generative AI analysis for complex threat logging |

---

## 12. Proposed System Architecture

```text
             INPUT (Webcam / CCTV)
                     │
                     ▼
      React Frontend (Bio-Scanner UI)
                     │
      POST Base64 Image to API Route
                     │
                     ▼
       Python Flask Backend (/api/detect)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   YOLOv8 Pose / CNN         Heuristic Extraction
        │                         │
        └────────────┬────────────┘
                     ▼
             Confidence Check
                     │
                     ▼
         Neon PostgreSQL Database
        (Match against known_faces)
                     │
                     ▼
    Log Event & Return to Dashboard UI
```

---

## 13. Limitations & Future Enhancements

**Limitations:**
* Poor performance with heavy occlusion (e.g., masks covering the entire side profile).
* Very small faces in extreme low-light conditions.

**Future Enhancements:**
* Full 3D head-pose estimation integration.
* Drone-camera integration via WebSockets.
* Edge deployment using Raspberry Pi/Jetson Nano.

---

## 14. One-Line Concept for Viva

If your examiner asks **"What is the main concept of your project?"**, you can answer:

> **"Our project, CIPHERGATE, uses YOLOv8-pose and deep learning to detect human faces from side/profile views in real-time, and integrates this computer vision pipeline into a full-stack React and PostgreSQL architecture for secure biometric logging and threat detection."**

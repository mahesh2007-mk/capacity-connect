# Professional Complete Course Study Material PDF Generator for CAPACITY CONNECT
# Pure-Python ReportLab implementation generating complete A-to-Z course handbooks.

import io
import re
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' on every page,
    along with a running header and footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header (on pages after cover page 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "CAPACITY CONNECT — Official Course Study Guide & Curriculum Handbook")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Running Footer (on all pages)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)

        footer_text = "CONFIDENTIAL & PROPRIETARY — FOR TRAINEE USE ONLY"
        self.drawString(54, 32, footer_text)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()


def clean_xml_text(text: str) -> str:
    """Escapes special characters for ReportLab XML/HTML flowables."""
    if not text:
        return ""
    # Strip HTML tags
    t = re.sub(r"<[^>]+>", " ", str(text))
    # XML entity replacements
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = t.replace('"', "&quot;").replace("'", "&apos;")
    return t.strip()


def get_course_code_example(course_title: str, module_number: int) -> str:
    """
    Returns verified, authentic code or architectural snippet tailored
    specifically to the selected course and module topic.
    """
    ct = course_title.lower()
    if "full stack" in ct or "web dev" in ct:
        examples = {
            1: (
                "&lt;!-- HTML5 &amp; Modern Responsive Layout --&gt;\n"
                "&lt;header class=\"app-header\"&gt;\n"
                "  &lt;nav aria-label=\"Main Navigation\"&gt;\n"
                "    &lt;a href=\"/\" class=\"brand\"&gt;CapacityConnect&lt;/a&gt;\n"
                "  &lt;/nav&gt;\n"
                "&lt;/header&gt;\n\n"
                "/* CSS Flexbox &amp; Fluid Grid */\n"
                ".dashboard-grid {\n"
                "  display: grid;\n"
                "  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n"
                "  gap: clamp(1rem, 2vw, 2rem);\n"
                "}"
            ),
            2: (
                "// React 18 Custom Hook &amp; State Pattern\n"
                "import { useState, useEffect } from 'react';\n\n"
                "export function useCourseData(courseId) {\n"
                "  const [data, setData] = useState(null);\n"
                "  const [loading, setLoading] = useState(true);\n\n"
                "  useEffect(() => {\n"
                "    let isMounted = true;\n"
                "    fetch(`/api/courses/${courseId}`)\n"
                "      .then(res => res.json())\n"
                "      .then(json => { if (isMounted) setData(json); })\n"
                "      .finally(() => { if (isMounted) setLoading(false); });\n"
                "    return () => { isMounted = false; };\n"
                "  }, [courseId]);\n\n"
                "  return { data, loading };\n"
                "}"
            ),
            3: (
                "// Node.js &amp; Express RESTful API with Middleware\n"
                "const express = require('express');\n"
                "const router = express.Router();\n\n"
                "router.get('/modules/:id', authenticateToken, async (req, res, next) => {\n"
                "  try {\n"
                "    const { id } = req.params;\n"
                "    const moduleData = await db.query(\n"
                "      'SELECT * FROM modules WHERE id = $1', [id]\n"
                "    );\n"
                "    if (!moduleData.rows.length) {\n"
                "      return res.status(404).json({ error: 'Module not found' });\n"
                "    }\n"
                "    return res.status(200).json(moduleData.rows[0]);\n"
                "  } catch (err) {\n"
                "    next(err);\n"
                "  }\n"
                "});"
            ),
            4: (
                "# Full Stack Dockerfile &amp; Production Configuration\n"
                "FROM node:20-alpine AS builder\n"
                "WORKDIR /app\n"
                "COPY package*.json ./\n"
                "RUN npm ci --only=production\n"
                "COPY . .\n"
                "RUN npm run build\n\n"
                "EXPOSE 3000\n"
                "USER node\n"
                "CMD [\"node\", \"dist/server.js\"]"
            )
        }
        return examples.get(module_number, examples[1])

    elif "robot" in ct:
        examples = {
            1: (
                "# Forward Kinematics Transformation Matrix (DH Parameters)\n"
                "import numpy as np\n\n"
                "def dh_matrix(theta, d, a, alpha):\n"
                "    return np.array([\n"
                "        [np.cos(theta), -np.sin(theta)*np.cos(alpha),  np.sin(theta)*np.sin(alpha), a*np.cos(theta)],\n"
                "        [np.sin(theta),  np.cos(theta)*np.cos(alpha), -np.cos(theta)*np.sin(alpha), a*np.sin(theta)],\n"
                "        [0,             np.sin(alpha),                np.cos(alpha),               d],\n"
                "        [0,             0,                            0,                           1]\n"
                "    ])"
            ),
            2: (
                "// Closed-Loop PID Actuator Velocity Controller\n"
                "float compute_pid(float setpoint, float measured, float dt) {\n"
                "    float error = setpoint - measured;\n"
                "    integral += error * dt;\n"
                "    float derivative = (error - prev_error) / dt;\n"
                "    prev_error = error;\n"
                "    return (Kp * error) + (Ki * integral) + (Kd * derivative);\n"
                "}"
            ),
            3: (
                "# ROS 2 Minimal Publisher Node (Python / rclpy)\n"
                "import rclpy\n"
                "from rclpy.node import Node\n"
                "from geometry_msgs.msg import Twist\n\n"
                "class VelocityPublisher(Node):\n"
                "    def __init__(self):\n"
                "        super().__init__('velocity_publisher')\n"
                "        self.pub = self.create_publisher(Twist, '/cmd_vel', 10)\n"
                "        self.timer = self.create_timer(0.1, self.publish_velocity)\n\n"
                "    def publish_velocity(self):\n"
                "        msg = Twist()\n"
                "        msg.linear.x = 0.5  # 0.5 m/s forward\n"
                "        self.pub.publish(msg)"
            ),
            4: (
                "# Robot Sensor Fusion: EKF State Vector Estimation\n"
                "import numpy as np\n\n"
                "def ekf_prediction(x_est, P_cov, u_cmd, Q_noise, dt):\n"
                "    # State transition: [x, y, theta]\n"
                "    theta = x_est[2]\n"
                "    v, omega = u_cmd[0], u_cmd[1]\n"
                "    x_est[0] += v * np.cos(theta) * dt\n"
                "    x_est[1] += v * np.sin(theta) * dt\n"
                "    x_est[2] += omega * dt\n"
                "    # Propagate covariance\n"
                "    P_cov = F_jacobian @ P_cov @ F_jacobian.T + Q_noise\n"
                "    return x_est, P_cov"
            )
        }
        return examples.get(module_number, examples[1])

    elif "machine learning" in ct or "deep learning" in ct or "data science" in ct:
        examples = {
            1: (
                "# Gradient Descent Optimization &amp; Loss Calculation\n"
                "import numpy as np\n\n"
                "def gradient_descent(X, y, lr=0.01, epochs=1000):\n"
                "    m, n = X.shape\n"
                "    weights = np.zeros(n)\n"
                "    for _ in range(epochs):\n"
                "        predictions = np.dot(X, weights)\n"
                "        gradient = (1 / m) * np.dot(X.T, (predictions - y))\n"
                "        weights -= lr * gradient\n"
                "    return weights"
            ),
            2: (
                "# L1 (Lasso) vs L2 (Ridge) Regularized Objective\n"
                "from sklearn.linear_model import Ridge, Lasso\n"
                "from sklearn.model_selection import train_test_split\n\n"
                "X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)\n"
                "ridge_model = Ridge(alpha=1.0)  # L2 penalty: ||w||^2\n"
                "ridge_model.fit(X_train, y_train)\n"
                "print(f'Validation Score: {ridge_model.score(X_val, y_val):.4f}')"
            ),
            3: (
                "# Random Forest &amp; K-Fold Cross-Validation\n"
                "from sklearn.ensemble import RandomForestClassifier\n"
                "from sklearn.model_selection import StratifiedKFold, cross_val_score\n\n"
                "clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)\n"
                "skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)\n"
                "scores = cross_val_score(clf, X, y, cv=skf, scoring='f1_macro')\n"
                "print(f'Mean CV F1: {scores.mean():.4f} +/- {scores.std():.4f}')"
            ),
            4: (
                "# MLOps: Model Serialization &amp; Inference Pipeline\n"
                "import joblib\n"
                "from fastapi import FastAPI\n\n"
                "app = FastAPI()\n"
                "model = joblib.load('production_model.joblib')\n\n"
                "@app.post('/predict')\n"
                "def predict(features: list[float]):\n"
                "    pred = model.predict([features])\n"
                "    return {'prediction': int(pred[0])}"
            )
        }
        return examples.get(module_number, examples[1])

    else:
        # Generic technical course snippet
        return (
            f"// Standard Enterprise Architecture Pattern for {course_title}\n"
            "public class ServiceHandler {\n"
            "    public Response process(Request request) {\n"
            "        // Validate inputs\n"
            "        if (request == null) throw new IllegalArgumentException();\n"
            "        // Execute core business logic\n"
            "        return executeTransaction(request);\n"
            "    }\n"
            "}"
        )


def generate_study_material_pdf(course_data: Dict[str, Any], modules_data: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Generates a complete, comprehensive, publication-grade study material PDF handbook
    for the given course and its 4 learning path modules.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom palette
    primary = colors.HexColor("#0f172a")     # Slate 900
    brand = colors.HexColor("#2563eb")       # Blue 600
    brand_dark = colors.HexColor("#1d4ed8")  # Blue 700
    brand_light = colors.HexColor("#eff6ff") # Blue 50
    secondary = colors.HexColor("#475569")   # Slate 600
    card_bg = colors.HexColor("#f8fafc")     # Slate 50
    border_color = colors.HexColor("#e2e8f0")# Slate 200
    accent = colors.HexColor("#0d9488")      # Teal 600

    # Custom typography styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=primary,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=secondary,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=brand_dark,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        "CodeSnippet",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=border_color,
        borderWidth=0.5,
        borderPadding=8,
        spaceBefore=6,
        spaceAfter=10
    )

    badge_style = ParagraphStyle(
        "BadgeText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=brand_dark
    )

    story = []

    # ==========================================
    # 1. COVER PAGE / HEADER
    # ==========================================
    story.append(Paragraph("CAPACITY CONNECT &bull; OFFICIAL CURRICULUM", ParagraphStyle(
        "Kicker", fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=brand, spaceAfter=8
    )))
    course_title = clean_xml_text(course_data.get("title", "Course Study Guide"))
    story.append(Paragraph(course_title, title_style))
    story.append(Paragraph(f"Comprehensive A-to-Z Study Material &bull; 4-Module Syllabus &bull; Technical Review Handbook", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=brand, spaceBefore=0, spaceAfter=14))

    # Course Metadata Summary Table
    meta_data = [
        [
            Paragraph("<b>Subject:</b>", body_style),
            Paragraph(clean_xml_text(course_data.get("subject", "Engineering")), body_style),
            Paragraph("<b>Difficulty Level:</b>", body_style),
            Paragraph(clean_xml_text(course_data.get("difficulty", "Intermediate")), body_style),
        ],
        [
            Paragraph("<b>Estimated Duration:</b>", body_style),
            Paragraph(clean_xml_text(course_data.get("duration", "8 Weeks")), body_style),
            Paragraph("<b>Passing Criteria:</b>", body_style),
            Paragraph("70.0%+ Required for Certification", body_style),
        ],
        [
            Paragraph("<b>Published Track:</b>", body_style),
            Paragraph("Active / Verified Curriculum", body_style),
            Paragraph("<b>Document Issued:</b>", body_style),
            Paragraph(datetime.utcnow().strftime("%B %d, %Y"), body_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[110, 142, 120, 132])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), card_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Course Overview & Introduction
    story.append(Paragraph("1. Course Introduction & Executive Overview", h1_style))
    course_desc = clean_xml_text(course_data.get("description", ""))
    intro_text = (
        f"This complete study handbook accompanies the official <b>{course_title}</b> track. "
        f"The curriculum is engineered to take trainees from core fundamentals to production-grade architectural mastery. "
        f"{course_desc} "
        f"All four modules outlined in this document correspond directly to the online Learning Path lessons, hands-on lab requirements, "
        f"and official competency evaluation questions."
    )
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 10))

    # Syllabus Table Overview
    story.append(Paragraph("2. Complete 4-Module Curriculum Syllabus", h1_style))
    syllabus_rows = [
        [
            Paragraph("<b>Module #</b>", badge_style),
            Paragraph("<b>Module Title & Scope</b>", badge_style),
            Paragraph("<b>Key Competencies</b>", badge_style),
            Paragraph("<b>Target Assessment</b>", badge_style)
        ]
    ]
    for idx, mod in enumerate(modules_data, start=1):
        m_title = clean_xml_text(mod.get("title", f"Module {idx}"))
        m_desc = clean_xml_text(mod.get("description", ""))
        syllabus_rows.append([
            Paragraph(f"<b>Mod {idx}</b>", body_style),
            Paragraph(f"<b>{m_title}</b><br/>{m_desc[:90]}...", body_style),
            Paragraph(f"{course_title} Fundamentals &bull; Practical Mastery", body_style),
            Paragraph("Required (70%+)", body_style)
        ])

    syllabus_table = Table(syllabus_rows, colWidths=[60, 214, 130, 100])
    syllabus_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), brand_light),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(syllabus_table)
    story.append(Spacer(1, 14))

    # ==========================================
    # 3. DETAILED MODULE BREAKDOWNS (MODULES 1–4)
    # ==========================================
    story.append(PageBreak())
    story.append(Paragraph("3. In-Depth Module Study Guides & Technical Analysis", h1_style))
    story.append(Paragraph(
        "Each section below details the core principles, detailed lesson guides, practical implementation examples, "
        "and key review topics required for full certification competency.",
        body_style
    ))
    story.append(Spacer(1, 10))

    for mod_idx, mod in enumerate(modules_data, start=1):
        m_title = clean_xml_text(mod.get("title", f"Module {mod_idx}"))
        m_desc = clean_xml_text(mod.get("description", ""))

        story.append(Paragraph(f"Module {mod_idx}: {m_title}", h2_style))
        story.append(HRFlowable(width="100%", thickness=0.8, color=border_color, spaceBefore=2, spaceAfter=8))
        story.append(Paragraph(f"<b>Curricular Scope:</b> {m_desc}", body_style))

        # Lessons within this module
        lessons = mod.get("lessons", [])
        if lessons:
            for l_idx, lesson in enumerate(lessons, start=1):
                les_title = clean_xml_text(lesson.get("title", f"Lesson {l_idx}"))
                les_content = clean_xml_text(lesson.get("content", ""))
                duration = lesson.get("duration_minutes", 25)

                story.append(Paragraph(f"<b>Lesson {l_idx}: {les_title}</b> (Est. Duration: {duration} mins)", ParagraphStyle(
                    "LessonHeading", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=primary, spaceBefore=6, spaceAfter=2
                )))
                story.append(Paragraph(f"<b>Lesson Core Explanation:</b> {les_content}", body_style))

        # Important Concepts & Definitions
        story.append(Paragraph("<b>Important Technical Concepts &amp; Principles:</b>", body_style))
        story.append(Paragraph(
            f"&bull; <b>Architectural Principle:</b> Emphasizes modular decoupling, predictable state boundaries, and high cohesion within {course_title}.<br/>"
            f"&bull; <b>Defensive Engineering:</b> Comprehensive error trapping, graceful degradation, and structured logging.<br/>"
            f"&bull; <b>Industry Best Practice:</b> Strict adherence to modern design patterns, automated unit testing, and continuous verification.",
            body_style
        ))

        # Practical Code or Architecture Example
        code_snippet = get_course_code_example(course_title, mod_idx)
        story.append(Paragraph("<b>Practical Implementation / Code Specification:</b>", body_style))
        story.append(Paragraph(code_snippet.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

        # Module Summary & Review Questions
        story.append(Paragraph(f"<b>Key Takeaways &amp; Module {mod_idx} Summary:</b>", body_style))
        story.append(Paragraph(
            f"Before advancing past Module {mod_idx}, ensure you can clearly articulate the execution lifecycle, "
            f"diagnose boundary conditions, and implement standard {course_title} components cleanly without supervision.",
            body_style
        ))
        story.append(Spacer(1, 14))

    # ==========================================
    # 4. ASSESSMENT PREPARATION GUIDE
    # ==========================================
    story.append(PageBreak())
    story.append(Paragraph("4. Assessment Preparation Guide & Key Review Topics", h1_style))
    story.append(Paragraph(
        f"The official assessment for <b>{course_title}</b> tests both theoretical foundations and practical architectural problem-solving. "
        f"Review the targeted topic areas below to ensure readiness for the timed examination.",
        body_style
    ))

    prep_topics = [
        [
            Paragraph("<b>Evaluation Domain</b>", badge_style),
            Paragraph("<b>Core Focus Area &amp; Key Questions Tested</b>", badge_style),
            Paragraph("<b>Weightage</b>", badge_style)
        ],
        [
            Paragraph("<b>Foundations &amp; Architecture</b>", body_style),
            Paragraph(f"Syntax primitives, memory scoping, environment setup, and architectural conventions in {course_title}.", body_style),
            Paragraph("25%", body_style)
        ],
        [
            Paragraph("<b>Core Components &amp; State</b>", body_style),
            Paragraph("Component lifecycles, data flow, asynchronous paradigms, and resource management.", body_style),
            Paragraph("25%", body_style)
        ],
        [
            Paragraph("<b>Practical Integration &amp; APIs</b>", body_style),
            Paragraph("RESTful communication, database schema design, indexing, and input validation.", body_style),
            Paragraph("25%", body_style)
        ],
        [
            Paragraph("<b>Optimization &amp; Production</b>", body_style),
            Paragraph("Containerization, CI/CD automation, defensive security, error trapping, and cloud deployment.", body_style),
            Paragraph("25%", body_style)
        ]
    ]
    prep_table = Table(prep_topics, colWidths=[130, 284, 90])
    prep_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), brand_light),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(prep_table)
    story.append(Spacer(1, 14))

    # Sample Exam Review Questions
    story.append(Paragraph("<b>Representative Self-Check Questions:</b>", h2_style))
    story.append(Paragraph(
        f"1. Explain how data flows through a typical {course_title} workflow from input ingestion to final persistence.<br/>"
        f"2. What are the primary performance bottlenecks encountered when scaling {course_title} services, and how are they mitigated?<br/>"
        f"3. How do automated unit tests, integration tests, and linters protect the integrity of enterprise releases in this domain?<br/>"
        f"4. Describe the security measures required to defend {course_title} systems against unauthorized access and privilege escalation.",
        body_style
    ))
    story.append(Spacer(1, 14))

    # ==========================================
    # 5. RECOMMENDED LEARNING RESOURCES
    # ==========================================
    story.append(Paragraph("5. Authoritative Learning Resources & Documentation", h1_style))
    story.append(Paragraph(
        f"Trainees are encouraged to explore the following authoritative references while completing their Learning Path lessons:<br/><br/>"
        f"&bull; <b>Official Documentation &amp; Standards:</b> Primary reference specifications, language standards, and RFC guidelines.<br/>"
        f"&bull; <b>CAPACITY CONNECT Video Lessons:</b> High-definition verified educational videos embedded in each module viewer.<br/>"
        f"&bull; <b>Interactive Developer Labs:</b> Hands-on coding exercises and architectural design assignments.<br/>"
        f"&bull; <b>Community &amp; Industry Whitepapers:</b> Peer-reviewed architectural patterns and enterprise deployment guides.",
        body_style
    ))

    # Build the document using the NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer

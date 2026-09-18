# Verified Course-Specific Assessment Question Banks for CAPACITY CONNECT
# Covers Full Stack Development, Robotics, Machine Learning, and standard technical tracks.

from typing import List, Dict, Any, Tuple

FULL_STACK_QUESTIONS: List[Tuple[str, str, str, str, str, str, str, str, str]] = [
    # (question_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, difficulty, topic)
    (
        "What is the primary function of semantic HTML5 elements like <header>, <main>, and <article>?",
        "To apply default CSS gradient backgrounds",
        "To provide meaningful document structure accessible to screen readers and search engine indexers",
        "To speed up browser JavaScript execution",
        "To replace server-side database tables",
        "B",
        "Semantic HTML elements convey meaning about their content, improving accessibility (a11y) and SEO.",
        "easy",
        "Frontend Foundations"
    ),
    (
        "Which CSS property controls 1-dimensional alignment along the main axis in a Flexbox container?",
        "align-items",
        "justify-content",
        "flex-direction",
        "align-content",
        "B",
        "justify-content distributes space and aligns items along the flex main axis.",
        "easy",
        "Frontend Foundations"
    ),
    (
        "What does the CSS 'box-sizing: border-box' rule do?",
        "Adds a 10px red outline to all elements",
        "Includes padding and border within the element's total declared width and height",
        "Removes all margins from child elements",
        "Forces the layout into a 3D isometric perspective",
        "B",
        "border-box ensures that padding and borders do not increase an element's total width and height.",
        "easy",
        "Frontend Foundations"
    ),
    (
        "What is the output of `typeof null` in standard JavaScript?",
        "'null'",
        "'object'",
        "'undefined'",
        "'boolean'",
        "B",
        "In JavaScript, typeof null returns 'object' due to an early historical implementation quirk.",
        "easy",
        "JavaScript Core"
    ),
    (
        "What is a closure in JavaScript?",
        "Closing the browser window via script",
        "A function bundled together with references to its surrounding lexical state, retaining access to outer variables",
        "A compiler error when a bracket is missing",
        "A private database connection",
        "B",
        "Closures allow an inner function to access an enclosing function's scope even after the outer function finishes executing.",
        "medium",
        "JavaScript Core"
    ),
    (
        "In the JavaScript runtime, which queue handles resolved Promise callbacks and queueMicrotask?",
        "Macrotask (Callback) Queue",
        "Microtask Queue",
        "Render Pipeline Queue",
        "Call Stack directly",
        "B",
        "Microtasks have higher priority than macrotasks and execute immediately after the current synchronous script.",
        "hard",
        "JavaScript Core"
    ),
    (
        "What does the Virtual DOM in React primarily achieve?",
        "Replaces the browser window with WebGL",
        "Computes minimal diffs in-memory to batch and minimize costly real DOM reflows and repaints",
        "Translates JavaScript directly to machine code",
        "Stores database records offline",
        "B",
        "The Virtual DOM enables efficient reconciliation, updating only changed DOM nodes.",
        "medium",
        "React Architecture"
    ),
    (
        "When does the cleanup function returned by a React `useEffect` hook execute?",
        "Only when the entire page is refreshed",
        "Before the component unmounts or before re-running the effect when dependencies change",
        "Immediately before the component renders",
        "Never, unless an error occurs",
        "B",
        "Effect cleanup functions run prior to re-execution or when the component unmounts to prevent memory leaks.",
        "medium",
        "React Architecture"
    ),
    (
        "Why must list items in React have unique and stable `key` props?",
        "To style alternating table rows",
        "To help React identify which items have been modified, added, or removed during reconciliation",
        "To assign database foreign keys",
        "To enforce TypeScript compile checks",
        "B",
        "Keys give React a stable identity for each list item during the virtual DOM diffing process.",
        "easy",
        "React Architecture"
    ),
    (
        "What is the difference between `useMemo` and `useCallback` in React?",
        "`useMemo` memoizes a computed value, whereas `useCallback` memoizes a callback function reference",
        "They are identical and interchangeable",
        "`useMemo` is used for CSS; `useCallback` is used for HTML",
        "`useCallback` runs synchronously on every keystroke",
        "A",
        "useMemo returns a memoized value; useCallback returns a memoized function instance.",
        "medium",
        "React Architecture"
    ),
    (
        "Which HTTP method is idempotent and semantically replaces the complete state of a resource?",
        "POST",
        "PUT",
        "PATCH",
        "CONNECT",
        "B",
        "PUT is idempotent and replaces the entire resource representation with the uploaded request payload.",
        "medium",
        "Backend & REST APIs"
    ),
    (
        "Which Express.js middleware is required to parse incoming JSON request payloads into `req.body`?",
        "express.static()",
        "express.json()",
        "express.urlencoded()",
        "cookie-parser",
        "B",
        "express.json() is the built-in middleware that parses incoming JSON requests.",
        "easy",
        "Backend & REST APIs"
    ),
    (
        "In Node.js, what does the non-blocking event loop allow the server to do?",
        "Run multi-threaded C++ processes directly in the browser",
        "Handle thousands of concurrent I/O operations on a single thread without blocking execution",
        "Bypass all security firewalls",
        "Compile Python scripts on the fly",
        "B",
        "Node's event-driven, non-blocking I/O model offloads I/O tasks to the OS/libuv, keeping the main thread responsive.",
        "medium",
        "Backend & REST APIs"
    ),
    (
        "What HTTP status code should a REST API return when a request succeeds in creating a new resource?",
        "200 OK",
        "201 Created",
        "204 No Content",
        "301 Moved Permanently",
        "B",
        "201 Created explicitly indicates that the request has succeeded and led to the creation of a new resource.",
        "easy",
        "Backend & REST APIs"
    ),
    (
        "What is CORS (Cross-Origin Resource Sharing) in web application architecture?",
        "A database backup protocol",
        "A browser security mechanism that uses HTTP headers to tell browsers whether a web app can access resources from a different origin",
        "A CSS layout technique for responsive images",
        "An authentication protocol replacing passwords",
        "B",
        "CORS is a W3C standard enforced by browsers to control cross-domain HTTP requests.",
        "medium",
        "Full Stack Architecture"
    ),
    (
        "In JSON Web Token (JWT) architecture, where should sensitive user claims be signed?",
        "On the client browser using LocalStorage",
        "On the backend server using a private secret key or private asymmetric key",
        "In public URL query parameters",
        "Inside a CSS stylesheet",
        "B",
        "JWTs must be signed by the server so any tampering with the token payload invalidates the signature.",
        "medium",
        "Full Stack Architecture"
    ),
    (
        "What are the four ACID properties in relational database management systems?",
        "Access, Control, Interface, Design",
        "Atomicity, Consistency, Isolation, Durability",
        "Asynchronous, Concurrent, Indexed, Distributed",
        "Authentication, Cryptography, Integrity, Decryption",
        "B",
        "ACID guarantees that database transactions are processed reliably.",
        "medium",
        "Databases & Data Modeling"
    ),
    (
        "What is the purpose of creating a B-Tree index on a database column?",
        "To encrypt column values",
        "To drastically accelerate query lookups and search filtering at the cost of slight write overhead",
        "To ensure the column contains no duplicate values automatically",
        "To compress image attachments",
        "B",
        "Indexes provide rapid O(log N) lookup paths for queries filtering on the indexed columns.",
        "medium",
        "Databases & Data Modeling"
    ),
    (
        "In SQL, which clause filters aggregated groups generated by a `GROUP BY` statement?",
        "WHERE",
        "HAVING",
        "ORDER BY",
        "LIMIT",
        "B",
        "WHERE filters individual rows before grouping; HAVING filters the groups resulting from GROUP BY.",
        "medium",
        "Databases & Data Modeling"
    ),
    (
        "What is the primary purpose of Docker containerization in full-stack engineering?",
        "To replace JavaScript with compiled binaries",
        "To package the application, dependencies, runtime, and configuration into a portable, reproducible image that runs consistently across environments",
        "To speed up CSS styling",
        "To eliminate the need for version control",
        "B",
        "Docker ensures environment parity across local development, testing, staging, and production.",
        "medium",
        "Deployment & DevOps"
    ),
    (
        "What is the primary difference between SQL (relational) and NoSQL (document-oriented) databases?",
        "SQL databases have no schemas; NoSQL uses rigid tables",
        "SQL uses structured tables with predefined schemas and relations; NoSQL stores flexible JSON-like documents without fixed schemas",
        "SQL can only run on Windows",
        "NoSQL does not support queries",
        "B",
        "Relational databases enforce strict tabular schemas, whereas document stores offer dynamic, flexible schemas.",
        "easy",
        "Databases & Data Modeling"
    ),
    (
        "In modern web security, what does CSRF stand for?",
        "Client-Side Resource Formatting",
        "Cross-Site Request Forgery",
        "Cascading Style Rendering Framework",
        "Cryptographic Secure Routing Foundation",
        "B",
        "CSRF is an attack that tricks an authenticated end user into submitting unauthorized requests to a web application.",
        "medium",
        "Full Stack Architecture"
    ),
    (
        "What is client-side hydration in modern full-stack frameworks (like Next.js or Remix)?",
        "Flushing the browser cache",
        "Attaching JavaScript event listeners and state to pre-rendered server HTML in the browser to make it interactive",
        "Downloading database records to local disk",
        "Converting CSS into images",
        "B",
        "Hydration preserves the fast initial HTML load from SSR while enabling dynamic client-side interactivity.",
        "hard",
        "Full Stack Architecture"
    ),
    (
        "Which of the following headers protects against Clickjacking attacks?",
        "X-Frame-Options: DENY",
        "Access-Control-Allow-Origin: *",
        "Content-Type: text/html",
        "Cache-Control: no-cache",
        "A",
        "X-Frame-Options: DENY prevents the page from being embedded in <iframe> elements on third-party sites.",
        "hard",
        "Full Stack Architecture"
    ),
    (
        "What does continuous integration (CI) automate in modern web engineering?",
        "Deleting old code repositories",
        "Building, linting, and running automated test suites on every pull request or commit to detect bugs early",
        "Buying cloud hosting servers",
        "Generating marketing emails",
        "B",
        "CI pipelines verify code quality and automated test suites before merging into the main branch.",
        "easy",
        "Deployment & DevOps"
    )
]

ROBOTICS_QUESTIONS: List[Tuple[str, str, str, str, str, str, str, str, str]] = [
    (
        "What is the primary purpose of forward kinematics in robotic manipulators?",
        "To calculate joint angles required to reach a target Cartesian position",
        "To determine the Cartesian position and orientation of the end-effector given specific joint angles",
        "To measure electrical current in the motors",
        "To compile ROS packages",
        "B",
        "Forward kinematics maps joint angles to the spatial coordinates of the end-effector.",
        "medium",
        "Kinematics & Dynamics"
    ),
    (
        "What problem does inverse kinematics solve in robotics?",
        "Computing actuator voltages",
        "Finding the required joint configurations to place the end-effector at a desired spatial coordinate",
        "Estimating battery discharge rates",
        "Mapping 2D LiDAR scans to images",
        "B",
        "Inverse kinematics solves for the joint variables that achieve a target position and orientation.",
        "medium",
        "Kinematics & Dynamics"
    ),
    (
        "What is the role of the Jacobian matrix in robotic manipulator dynamics?",
        "It stores joint names",
        "It relates joint velocities to linear and angular velocities of the end-effector",
        "It measures temperature",
        "It regulates battery power",
        "B",
        "The Jacobian matrix linearly maps joint parameter velocities to end-effector Cartesian velocities.",
        "hard",
        "Kinematics & Dynamics"
    ),
    (
        "What standard kinematic convention uses four parameters (theta, d, a, alpha) to describe links and joints?",
        "Euler-Lagrange Form",
        "Denavit-Hartenberg (DH) Convention",
        "Newton-Euler Formulation",
        "Hamiltonian Mechanics",
        "B",
        "The DH convention attaches coordinate frames to links to systematically solve kinematics.",
        "hard",
        "Kinematics & Dynamics"
    ),
    (
        "In Robot Operating System (ROS / ROS2), what communication pattern is used for many-to-many asynchronous data streaming?",
        "Client-Server RPC",
        "Publish-Subscribe Topics",
        "Direct Memory Sharing",
        "RESTful HTTP polling",
        "B",
        "ROS topics implement a decoupled publish-subscribe pattern ideal for continuous sensor streams.",
        "easy",
        "ROS & System Architecture"
    ),
    (
        "What is the main difference between a ROS Service and a ROS Action?",
        "Services are for sensors; Actions are for cameras",
        "Services are synchronous request-reply calls; Actions provide non-blocking execution with feedback and cancelability for long-running goals",
        "Actions are deprecated in ROS2",
        "Services require no network connection",
        "B",
        "Actions are designed for long-duration tasks like navigation where progress feedback and preemption are required.",
        "medium",
        "ROS & System Architecture"
    ),
    (
        "What type of sensor measures linear acceleration and angular velocity for robot state estimation?",
        "LiDAR",
        "Inertial Measurement Unit (IMU)",
        "Potentiometer",
        "Infrared proximity sensor",
        "B",
        "An IMU combines accelerometers and gyroscopes to track orientation and inertial motion.",
        "easy",
        "Sensors & Perception"
    ),
    (
        "What algorithm is widely used in mobile robotics for Simultaneous Localization and Mapping (SLAM)?",
        "K-Means Clustering",
        "Extended Kalman Filter (EKF) / Graph-based SLAM",
        "Bubble Sort",
        "Gradient Descent",
        "B",
        "EKF-SLAM and Graph-SLAM build spatial maps while estimating the robot's real-time pose.",
        "medium",
        "Sensors & Perception"
    ),
    (
        "Which type of motor provides precise angular position control using closed-loop feedback from an encoder or potentiometer?",
        "Standard DC Brushed Motor",
        "Servomotor",
        "AC Induction Motor",
        "Pneumatic cylinder",
        "B",
        "Servomotors combine a motor, gearbox, position sensor, and closed-loop control circuit.",
        "easy",
        "Actuators & Control"
    ),
    (
        "In classical robot motion control, what does the PID controller stand for?",
        "Position, Interface, Direction",
        "Proportional, Integral, Derivative",
        "Precision, Inertia, Displacement",
        "Protocol, Interface, Dynamics",
        "B",
        "PID controllers use proportional, integral, and derivative terms to minimize error.",
        "easy",
        "Actuators & Control"
    ),
    (
        "What does the Derivative (D) term in a PID controller primarily prevent?",
        "Steady-state error",
        "Overshoot and excessive oscillation by predicting future error based on rate of change",
        "Motor overheating",
        "Sensor noise",
        "B",
        "The derivative term dampens the system response, reducing overshoot and settling time.",
        "medium",
        "Actuators & Control"
    ),
    (
        "In robotic vision, what is the purpose of Point Cloud processing (e.g. via PCL)?",
        "Playing 3D video games",
        "Analyzing 3D spatial coordinates returned by LiDAR or depth cameras for obstacle avoidance and object detection",
        "Compressing JPEG images",
        "Formatting UI graphics",
        "B",
        "Point clouds represent surface geometries in 3D space, vital for autonomous navigation.",
        "medium",
        "Sensors & Perception"
    ),
    (
        "What serial communication protocol uses differential signaling on CAN-High and CAN-Low for noise-immune automotive and robotic networks?",
        "I2C",
        "CAN Bus (Controller Area Network)",
        "SPI",
        "RS-232",
        "B",
        "CAN bus uses differential balanced signaling, making it exceptionally resilient in electrically noisy robotic environments.",
        "medium",
        "Embedded Hardware & Interfaces"
    ),
    (
        "What is the Degrees of Freedom (DoF) of a robot manipulator?",
        "The price of the robot in dollars",
        "The number of independent coordinates or variables required to completely define its configuration in space",
        "The weight capacity of the gripper",
        "The number of wheels on the chassis",
        "B",
        "DoF represents the number of independent motions a robotic mechanism can perform.",
        "easy",
        "Kinematics & Dynamics"
    ),
    (
        "What safety feature is legally mandated on all industrial robotic workcells?",
        "Remote web browser control",
        "Hardwired Emergency Stop (E-Stop) circuit and safety interlocks",
        "Wireless Bluetooth connectivity",
        "Solar power panels",
        "B",
        "E-Stops safely and immediately remove actuator power during emergencies in compliance with ISO 10218.",
        "easy",
        "Industrial Automation & Safety"
    )
]

MACHINE_LEARNING_QUESTIONS: List[Tuple[str, str, str, str, str, str, str, str, str]] = [
    (
        "What is the fundamental difference between Supervised and Unsupervised learning?",
        "Supervised uses Python; Unsupervised uses R",
        "Supervised learning trains on labeled input-output pairs; Unsupervised learning discovers hidden patterns in unlabeled data",
        "Supervised requires GPUs; Unsupervised requires CPUs only",
        "Unsupervised learning always achieves 100% accuracy",
        "B",
        "Supervised learning learns a mapping from features to targets; unsupervised finds latent clusters/distributions without labels.",
        "easy",
        "Core ML Foundations"
    ),
    (
        "What does the learning rate hyperparameter control in gradient descent optimization?",
        "The total number of CPU threads",
        "The step size taken in the direction of the negative gradient at each optimization iteration",
        "The size of the test dataset",
        "The clock speed of the graphics card",
        "B",
        "The learning rate determines how far model weights move along the loss gradient in each step.",
        "easy",
        "Optimization & Loss Functions"
    ),
    (
        "What is the mathematical difference between L1 (Lasso) and L2 (Ridge) regularization?",
        "L1 adds squared weights; L2 adds absolute weights",
        "L1 adds the absolute value of weights, promoting sparsity; L2 adds squared weights, penalizing large weights smoothly",
        "L1 is only for neural networks; L2 is for linear regression",
        "They have identical penalties",
        "B",
        "L1 produces sparse models by driving coefficients to exact zero; L2 shrinks weights uniformly.",
        "medium",
        "Model Generalization & Regularization"
    ),
    (
        "What problem occurs when a machine learning model learns noise and training data peculiarities rather than generalizable trends?",
        "Underfitting",
        "Overfitting (High Variance)",
        "Data Imbalance",
        "Feature Drift",
        "B",
        "Overfitting occurs when a model captures random noise in training data, failing on unseen test data.",
        "easy",
        "Model Generalization & Regularization"
    ),
    (
        "Which evaluation metric is the harmonic mean of Precision and Recall, making it ideal for imbalanced classification tasks?",
        "Accuracy",
        "F1-Score",
        "Mean Squared Error (MSE)",
        "R-squared",
        "B",
        "The F1-score balances precision and recall, especially useful when true negatives outnumber positives heavily.",
        "medium",
        "Evaluation & Metrics"
    ),
    (
        "How does a Random Forest model construct an ensemble of decision trees?",
        "By training each tree on identical data sequentially",
        "Using Bootstrap Aggregating (Bagging) on data samples and selecting random feature subsets at each split",
        "By averaging the names of the features",
        "By pruning all branches after training",
        "B",
        "Random Forest combines bagging with feature subsampling to reduce variance and avoid overfitting.",
        "medium",
        "Tree Models & Ensembles"
    ),
    (
        "In neural networks, why are non-linear activation functions (like ReLU or GELU) necessary between linear layers?",
        "To speed up hard drive storage",
        "To allow the network to approximate complex non-linear decision boundaries; otherwise multiple layers collapse into a single linear transformation",
        "To convert floating-point numbers into integers",
        "To prevent gradient descent from running",
        "B",
        "Without non-linear activations, composing linear layers results in nothing more than another linear function.",
        "medium",
        "Neural Networks & Deep Learning"
    ),
    (
        "What algorithm efficiently calculates gradients of the loss function with respect to each weight in a neural network using the chain rule of calculus?",
        "Simulated Annealing",
        "Backpropagation",
        "Monte Carlo Tree Search",
        "Principal Component Analysis",
        "B",
        "Backpropagation applies the calculus chain rule recursively from the output layer back to the input layer.",
        "medium",
        "Neural Networks & Deep Learning"
    ),
    (
        "How does the K-Means clustering algorithm assign data points to clusters?",
        "By building a deep convolutional tree",
        "By iteratively assigning points to the nearest centroid and recalculating centroids as the mean of assigned points",
        "By sorting points alphabetically",
        "By evaluating loss on a labeled target column",
        "B",
        "K-Means minimizes within-cluster sum of squares (inertia) through iterative centroid updates.",
        "easy",
        "Unsupervised Learning"
    ),
    (
        "What does Cross-Validation (e.g. 5-Fold Stratified CV) achieve?",
        "Compresses the dataset into a zip archive",
        "Provides an unbiased, reliable estimate of model performance across multiple partitioned training/validation splits",
        "Replaces the loss function with accuracy",
        "Generates synthetic image samples",
        "B",
        "K-Fold CV assesses generalization by rotating through distinct validation folds.",
        "easy",
        "Evaluation & Metrics"
    ),
    (
        "What is the vanishing gradient problem in deep neural network training?",
        "When data files are accidentally deleted",
        "When gradients shrink exponentially as they propagate backward through many layers, causing early layers to train very slowly",
        "When model accuracy drops to zero instantly",
        "When weights grow to infinity",
        "B",
        "Vanishing gradients occur with saturating activations like Sigmoid in deep networks, solved by ReLU, batch norm, or residual connections.",
        "hard",
        "Neural Networks & Deep Learning"
    ),
    (
        "In MLOps, what is 'Data Drift' (covariate shift)?",
        "A hardware malfunction in storage drives",
        "A change in the statistical distribution of input features over time relative to the distribution the model was trained on",
        "Deleting features during preprocessing",
        "Renaming columns in SQL",
        "B",
        "Data drift occurs when production inputs evolve, degrading model inference accuracy over time.",
        "medium",
        "MLOps & Production"
    ),
    (
        "Which dimensionality reduction technique finds orthogonal axes (eigenvectors) that maximize the variance of the data?",
        "T-SNE",
        "Principal Component Analysis (PCA)",
        "K-Nearest Neighbors",
        "Logistic Regression",
        "B",
        "PCA projects high-dimensional data onto orthogonal principal components with maximal variance.",
        "medium",
        "Unsupervised Learning"
    ),
    (
        "What does the ROC-AUC score measure in binary classification?",
        "The training time in milliseconds",
        "The area under the receiver operating characteristic curve, quantifying the model's ability to rank positive instances higher than negatives across all classification thresholds",
        "The number of lines of Python code",
        "The memory footprint of the model",
        "B",
        "AUC measures the model's discriminative ability independent of the decision threshold.",
        "medium",
        "Evaluation & Metrics"
    ),
    (
        "What is the purpose of Early Stopping during iterative machine learning model training?",
        "To stop the computer from overheating",
        "To halt training when validation performance ceases to improve, preventing overfitting",
        "To skip unit tests",
        "To randomly delete half the dataset",
        "B",
        "Early stopping monitors validation loss and terminates training before the model overfits the training set.",
        "easy",
        "Model Generalization & Regularization"
    )
]

def get_bank_questions_for_domain(domain: str) -> List[Tuple[str, str, str, str, str, str, str, str, str]]:
    d = domain.lower()
    if "full stack" in d or "fullstack" in d or "web dev" in d:
        return FULL_STACK_QUESTIONS
    elif "robot" in d:
        return ROBOTICS_QUESTIONS
    elif "machine learning" in d or "data science" in d or "deep learning" in d or "ai" in d:
        return MACHINE_LEARNING_QUESTIONS
    return []

const API_BASE_URL = "http://localhost:5000";
document.addEventListener("DOMContentLoaded", () => {
    initMatrixEffect();
    initAuthSystem();
    initToggleList();
    initWebsiteRequestForm();
    initRequestFormPopup(); 
});

// ===== Matrix Effect =====
function initMatrixEffect() {
    const canvas = document.getElementById("matrixCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        const header = document.querySelector("header");
        canvas.width = header.clientWidth;
        canvas.height = header.clientHeight;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()YOUHAVEBEENHACKEDUSINGLINUXCODETHEREPER!@#$%^&*()?><l"
    const matrix = letters.split("");

    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(0);

    function drawMatrix() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "limegreen";
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = matrix[Math.floor(Math.random() * matrix.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(drawMatrix, 50);
}

// ===== Toggle Website List =====
function initToggleList() {
  const toggleButton = document.getElementById("toggleList");
  const websiteList = document.getElementById("websiteList");
  const toggleArrow = document.getElementById("toggleArrow");

  toggleButton?.addEventListener("click", () => {
      if (websiteList.style.display === "none" || websiteList.style.display === "") {
          websiteList.style.display = "block";
          toggleArrow.textContent = "▲";
      } else {
          websiteList.style.display = "none";
          toggleArrow.textContent = "▼";
      }
  });
}


// Update the initAuthSystem function
function initAuthSystem() {
    const loginModal = document.getElementById("authModal");
    const openLoginBtn = document.getElementById("openLogin");
    const closeModalBtn = document.querySelector("#authModal .close");
    const loggedInUser = document.getElementById("loggedInUser");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const showSignUp = document.getElementById("showSignUp");
    const showLogin = document.getElementById("showLogin");

    // Modal controls
    openLoginBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        loginModal.classList.add('active');
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        clearMessages();
    });

    closeModalBtn?.addEventListener("click", () => {
        loginModal.classList.remove('active');
    });

    window.onclick = (event) => {
        if (event.target === loginModal) {
            loginModal.classList.remove('active');
        }
    };

       // Form toggles
       showSignUp?.addEventListener("click", (e) => {
        e.preventDefault();
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
        clearMessages();
    });

    showLogin?.addEventListener("click", (e) => {
        e.preventDefault();
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        clearMessages();
    });

    // Login logic - Fixed endpoint
    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("/api/login", {  // Changed to /api/login
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                showLoginError(data.error || "Login failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            
            showLoginSuccess("Login successful!");
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            showLoginError("Network error. Try again later");
        }
    });

    // Signup logic - Fixed endpoint and error handling
    signupForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const signupData = {
            username: document.getElementById("signup-username").value,
            email: document.getElementById("signup-email").value,
            phone: document.getElementById("signup-phone").value,
            password: document.getElementById("signup-password").value
        };

        try {
            const response = await fetch("/api/signup", {  // Changed to /api/signup
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(signupData) 
            });

            const data = await response.json();
            
            if (!response.ok) {
                showSignupError(data.error || "Signup failed");
                return;
            }

            showSignupSuccess("Signup successful!");
            signupForm.reset();
            setTimeout(() => {
                loginForm.classList.remove("hidden");
                signupForm.classList.add("hidden");
            }, 1500);
        } catch (error) {
            showSignupError("Network error. Try again later");
        }
    });

    // Profile management
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.className = "logout-btn hidden";

    // Load user profile
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    
    if (token && username) {
        updateUserProfile(username, email);
    }

    // Profile click handler
    loggedInUser?.addEventListener("click", (e) => {
        e.stopPropagation();
        logoutBtn.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        logoutBtn.classList.add("hidden");
    });

    logoutBtn?.addEventListener("click", () => {
        localStorage.clear();
        window.location.reload();
    });

function updateUserProfile(username, email) {
    loggedInUser.innerHTML = `<span>${username}</span>`;
    loggedInUser.classList.remove("hidden");
    openLoginBtn.classList.add("hidden");
    loggedInUser.parentNode.appendChild(logoutBtn);
    logoutBtn.classList.remove("hidden");
    }
    
function clearMessages() {
    document.getElementById("error-message").textContent = "";
    document.getElementById("signup-error-message").textContent = "";
}

function showLoginSuccess(message) {
    const elem = document.getElementById("error-message");
    elem.style.color = "limegreen";
    elem.textContent = message;
}

function showLoginError(message) {
    const elem = document.getElementById("error-message");
    elem.style.color = "red";
    elem.textContent = message;
}

function showSignupSuccess(message) {
    const elem = document.getElementById("signup-error-message");
    elem.style.color = "limegreen";
    elem.textContent = message;
}

function showSignupError(message) {
    const elem = document.getElementById("signup-error-message");
    elem.style.color = "red";
    elem.textContent = message;
}};

// ===== Request Form Popup =====
function initRequestFormPopup() {
    const requestModal = document.getElementById("requestFormModal");
    const openRequestLinks = document.querySelectorAll(".open-request-form");
    const closeRequestModal = document.querySelector(".close-modal");

    openRequestLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            requestModal.classList.add("active");
        });
    });

    closeRequestModal?.addEventListener("click", () => {
        requestModal.classList.remove("active");
    });

    window.addEventListener("click", (e) => {
        if (e.target === requestModal) {
            requestModal.classList.remove("active");
        }
    });
}

// Update the initWebsiteRequestForm function

showSignUpFromRequest?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("requestFormModal").classList.remove("active");
    document.getElementById("authModal").classList.add("active");
});

function initWebsiteRequestForm() {
    const requestForm = document.getElementById('requestForm');
    const requestStatus = document.getElementById('requestStatus');

    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('requestPhone').value;
        const websiteType = document.getElementById('websiteType').value;
        const requirements = document.getElementById('requirements').value;
        const password = document.getElementById('requestPassword').value;
        const token = localStorage.getItem('token');

        if (!token) {
            requestStatus.textContent = 'Please login first!';
            requestStatus.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/api/request-website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone,
                    websiteType,
                    requirements,
                    password
                })
            });

            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Request failed');

            requestStatus.textContent = 'Request submitted successfully!';
            requestStatus.style.color = 'limegreen';
            requestForm.reset();
            setTimeout(() => {
                document.getElementById('requestFormModal').classList.remove('active');
            }, 2000);
        } catch (error) {
            requestStatus.textContent = error.message || 'Failed to submit request';
            requestStatus.style.color = 'red';
        }
    });
}


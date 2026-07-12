/* --- js/security.js --- */
/* DesignCraft Security Engine
   Rate limiting, prompt injection detection, CSP, usage tracking */

class SecurityEngine {
    constructor() {
        this.DAILY_LIMIT_FREE = 30;
        this.DAILY_LIMIT_AUTH = 200;
        this.PROMPT_MAX_LENGTH = 1200;
        this.RATE_WINDOW_MS = 60000;
        this.BURST_LIMIT = 5;
        this._requestTimestamps = [];
        this._initCSP();
    }

    _initCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://unpkg.com https://www.gstatic.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src https://fonts.gstatic.com",
            "connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://unpkg.com https://www.gstatic.com",
            "img-src 'self' data: blob: https:",
            "frame-src 'self' blob: https://*.firebaseapp.com"
        ].join('; ');
        document.head.prepend(meta);
    }

    scanPrompt(prompt) {
        const injectionPatterns = [
            /ignore previous instructions/i,
            /disregard (all|your|the) (previous|prior|above|earlier) (instructions?|rules?|directives?|prompts?)/i,
            /you are now/i,
            /act as (a |an )?(different|new|another|evil|unrestricted)/i,
            /jailbreak/i,
            /dan mode/i,
            /bypass (your|the|all) (filters?|restrictions?|rules?|safety)/i,
            /pretend (you are|to be)/i,
            /from now on (you|ignore)/i,
            /forget (all|your|everything)/i,
            /<script[\s\S]*?>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /document\.(cookie|write|location)/i,
            /window\.(location|open)/i
        ];

        for (const pattern of injectionPatterns) {
            if (pattern.test(prompt)) {
                return { safe: false, reason: 'Prompt contains restricted content. Describe a UI design only.' };
            }
        }

        if (prompt.length > this.PROMPT_MAX_LENGTH) {
            return { safe: false, reason: `Prompt too long (${prompt.length}/${this.PROMPT_MAX_LENGTH} chars). Please shorten it.` };
        }

        return { safe: true };
    }

    checkRateLimit() {
        const now = Date.now();
        this._requestTimestamps = this._requestTimestamps.filter(t => now - t < this.RATE_WINDOW_MS);
        if (this._requestTimestamps.length >= this.BURST_LIMIT) {
            const wait = Math.ceil((this.RATE_WINDOW_MS - (now - this._requestTimestamps[0])) / 1000);
            return { allowed: false, reason: `Too many requests. Please wait ${wait}s.` };
        }
        this._requestTimestamps.push(now);
        return { allowed: true };
    }

    getDailyKey() {
        return `dc_usage_${new Date().toISOString().slice(0, 10)}`;
    }

    checkDailyQuota(isAuthenticated) {
        const key = this.getDailyKey();
        const used = parseInt(localStorage.getItem(key) || '0', 10);
        const limit = isAuthenticated ? this.DAILY_LIMIT_AUTH : this.DAILY_LIMIT_FREE;
        if (used >= limit) {
            return { allowed: false, used, limit, reason: `Daily limit reached (${used}/${limit} generations). Resets at midnight.` };
        }
        return { allowed: true, used, limit };
    }

    incrementDailyUsage() {
        const key = this.getDailyKey();
        const used = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, used + 1);
        return used + 1;
    }

    getDailyUsage() {
        return parseInt(localStorage.getItem(this.getDailyKey()) || '0', 10);
    }

    sanitizeOutput(html) {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/\s*(on\w+\s*=)[^>]*/gi, '');
    }

    runFullCheck(prompt, isAuthenticated) {
        const rateCheck = this.checkRateLimit();
        if (!rateCheck.allowed) return { ok: false, reason: rateCheck.reason };

        const promptCheck = this.scanPrompt(prompt);
        if (!promptCheck.safe) return { ok: false, reason: promptCheck.reason };

        const quotaCheck = this.checkDailyQuota(isAuthenticated);
        if (!quotaCheck.allowed) return { ok: false, reason: quotaCheck.reason };

        return { ok: true, quotaCheck };
    }
}

window.securityEngine = new SecurityEngine();


/* --- js/firebase.js --- */
/* DesignCraft Firebase & LocalStorage Service
   Integrates user authentication, project save/load syncing, and provides
   an offline LocalStorage mode when Firebase credentials are not provided. */

class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        
        this.isFirebaseInitialized = false;
        this.user = null;
        this.localMode = true; // Default to offline LocalStorage mode
        
        this.initElements();
        this.loadConfigAndConnect();
        this.initFormListeners();
    }

    initElements() {
        // Navbar hooks
        this.btnSave = document.getElementById('btn-save-project');
        this.btnOpenProjects = document.getElementById('btn-open-projects');
        this.btnLoginTrigger = document.getElementById('btn-login-trigger');
        this.profileBadge = document.getElementById('user-profile-badge');
        this.profileName = document.getElementById('profile-display-name');
        this.profileEmail = document.getElementById('profile-display-email');
        this.avatarInitials = document.getElementById('user-avatar-initials');
        this.btnLogout = document.getElementById('btn-logout');
        
        // Modals
        this.modalAuth = document.getElementById('modal-auth');
        this.modalAuthClose = document.getElementById('modal-auth-close');
        this.modalConfig = document.getElementById('modal-firebase-config');
        this.modalConfigClose = document.getElementById('modal-firebase-config-close');
        this.modalProjects = document.getElementById('modal-projects');
        this.modalProjectsClose = document.getElementById('modal-projects-close');
        
        // Auth form
        this.authForm = document.getElementById('auth-form');
        this.authTitle = document.getElementById('auth-title');
        this.authSubmitBtn = document.getElementById('btn-auth-submit');
        this.btnGoogleSignIn = document.getElementById('btn-google-sign-in');
        this.authToggleLink = document.getElementById('auth-toggle-link');
        this.authToggleText = document.getElementById('auth-toggle-text');
        this.authErrorBox = document.getElementById('auth-error-box');
        
        // Config form
        this.configForm = document.getElementById('firebase-config-form');
    }

    // Try to retrieve custom firebase config and connect
    loadConfigAndConnect() {
        const defaultFirebaseConfig = {
            apiKey: "AIzaSyCEyYWfOIWH_7Y3lOGE_jM9dYiM3Ctr6Hc",
            authDomain: "gen-lang-client-0444919395.firebaseapp.com",
            databaseURL: "https://gen-lang-client-0444919395-default-rtdb.firebaseio.com",
            projectId: "gen-lang-client-0444919395",
            storageBucket: "gen-lang-client-0444919395.firebasestorage.app",
            messagingSenderId: "298029099413",
            appId: "1:298029099413:web:49684693d7ed02359cee9c"
        };

        const savedConfig = localStorage.getItem('designcraft_firebase_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.initializeFirebase(config);
            } catch (err) {
                console.error("Failed to parse saved Firebase config. Retrying default...", err);
                this.initializeFirebase(defaultFirebaseConfig);
            }
        } else {
            console.log("No saved config. Attempting default cloud config connection...");
            this.initializeFirebase(defaultFirebaseConfig);
        }
    }

    initializeFirebase(config) {
        // Validate config has minimal requirements
        if (!config.apiKey || !config.projectId) {
            this.localMode = true;
            return;
        }

        try {
            // If another firebase app was initialized, delete it
            if (firebase.apps.length > 0) {
                firebase.app().delete();
            }

            this.app = firebase.initializeApp(config);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.isFirebaseInitialized = true;
            this.localMode = false;
            
            // Listen for Auth changes
            this.auth.onAuthStateChanged((user) => {
                this.user = user;
                this.authReady = true; // Auth state resolved
                this.updateAuthUi(user);
            });
            console.log("Firebase initialized successfully.");
        } catch (err) {
            console.error("Firebase connection failed. Defaulting to Local Mode.", err);
            this.localMode = true;
            this.isFirebaseInitialized = false;
            this.updateAuthUi(null);
        }
    }

    updateAuthUi(user) {
        if (user && !this.localMode) {
            // Logged in via Firebase
            this.btnLoginTrigger.classList.add('hidden');
            this.profileBadge.classList.remove('hidden');
            this.btnOpenProjects.classList.remove('hidden');
            
            const name = user.displayName || user.email.split('@')[0];
            this.profileName.innerText = name;
            this.profileEmail.innerText = user.email;
            this.avatarInitials.innerText = name.substring(0, 2).toUpperCase();

            // Inject MCP endpoint URL for this user
            const mcpInput = document.getElementById('mcp-endpoint-url');
            if (mcpInput) mcpInput.value = `https://designcraft-css.vercel.app/api/mcp?token=${user.uid}`;
        } else {
            // Logged out or Local mode
            this.profileBadge.classList.add('hidden');
            this.btnOpenProjects.classList.remove('hidden'); // Available in local mode too!
            
            if (this.localMode) {
                // Local Mode Indicator
                this.btnLoginTrigger.classList.remove('hidden');
                this.btnLoginTrigger.innerHTML = '<i data-lucide="cloud-off"></i> Offline Mode';
            } else {
                this.btnLoginTrigger.classList.remove('hidden');
                this.btnLoginTrigger.innerHTML = '<i data-lucide="log-in"></i> Sign In';
            }
        }
        lucide.createIcons();
    }

    initFormListeners() {
        // Open/Close triggers
        this.btnLoginTrigger?.addEventListener('click', () => {
            this.modalAuth.classList.remove('hidden');
            this.resetAuthForm();
        });
        this.modalAuthClose?.addEventListener('click', () => this.modalAuth.classList.add('hidden'));
        
        document.getElementById('btn-open-firebase-config')?.addEventListener('click', () => {
            this.modalConfig.classList.remove('hidden');
            this.populateConfigForm();
        });
        
        document.getElementById('btn-auth-settings')?.addEventListener('click', () => {
            this.modalAuth.classList.add('hidden');
            this.modalConfig.classList.remove('hidden');
            this.populateConfigForm();
        });
        
        this.modalConfigClose?.addEventListener('click', () => this.modalConfig.classList.add('hidden'));
        
        this.btnOpenProjects?.addEventListener('click', () => {
            this.modalProjects.classList.remove('hidden');
            this.loadAndRenderProjects();
        });
        this.modalProjectsClose?.addEventListener('click', () => this.modalProjects.classList.add('hidden'));
        
        // Save current canvas click
        this.btnSave?.addEventListener('click', () => this.saveCurrentProject());

        // Toggle Auth Registration/Login modes
        let isSignUpMode = false;
        this.authToggleLink?.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            
            this.authTitle.innerText = isSignUpMode ? "Create Account" : "Welcome Back";
            this.authSubmitBtn.innerHTML = isSignUpMode ? '<i data-lucide="user-plus"></i> Sign Up' : '<i data-lucide="log-in"></i> Sign In';
            this.authToggleText.innerText = isSignUpMode ? "Already have an account?" : "Don't have an account?";
            this.authToggleLink.innerText = isSignUpMode ? "Sign In" : "Sign Up";
            this.authErrorBox.classList.add('hidden');
            lucide.createIcons();
        });

        // Submit Auth Form
        this.authForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email')?.value;
            const password = document.getElementById('auth-password')?.value;
            this.authErrorBox.classList.add('hidden');
            
            if (this.localMode) {
                this.showAuthError("Please connect Firebase first using 'Firebase Config' setup.");
                return;
            }

            try {
                if (isSignUpMode) {
                    // Create account
                    await this.auth.createUserWithEmailAndPassword(email, password);
                } else {
                    // Log in
                    await this.auth.signInWithEmailAndPassword(email, password);
                }
                this.modalAuth.classList.add('hidden');
            } catch (err) {
                this.showAuthError(err.message);
            }
        });

        // Google Sign In trigger
        if (this.btnGoogleSignIn) {
            this.btnGoogleSignIn?.addEventListener('click', async () => {
                if (this.localMode || !this.auth) {
                    this.showAuthError("Firebase is running in offline local mode. Switch to online mode or configure custom settings first.");
                    return;
                }
                const provider = new firebase.auth.GoogleAuthProvider();
                this.authErrorBox.classList.add('hidden');
                try {
                    await this.auth.signInWithPopup(provider);
                    this.modalAuth.classList.add('hidden');
                } catch (err) {
                    if (err.code === 'auth/unauthorized-domain') {
                        this.showAuthError("Vercel domain not authorized! Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add: designcraft-css.vercel.app");
                    } else if (err.code === 'auth/popup-closed-by-user') {
                        this.showAuthError("Sign in was cancelled (pop-up closed).");
                    } else {
                        this.showAuthError(err.message);
                    }
                }
            });
        }

        // Logout
        this.btnLogout?.addEventListener('click', () => {
            if (this.auth) {
                this.auth.signOut();
            }
            this.user = null;
            this.updateAuthUi(null);
        });

        // Use Offline fallbacks
        document.getElementById('btn-auth-local')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.localMode = true;
            this.updateAuthUi(null);
            this.modalAuth.classList.add('hidden');
        });

        // Save Custom Configuration
        document.getElementById('btn-save-firebase-config')?.addEventListener('click', () => {
            const apiKey = document.getElementById('fb-apiKey')?.value.trim();
            const authDomain = document.getElementById('fb-authDomain')?.value.trim();
            const projectId = document.getElementById('fb-projectId')?.value.trim();
            const storageBucket = document.getElementById('fb-storageBucket')?.value.trim();
            const messagingSenderId = document.getElementById('fb-messagingSenderId')?.value.trim();
            const appId = document.getElementById('fb-appId')?.value.trim();

            if (!apiKey || !projectId) {
                // Clear configuration -> Reset to default local storage
                localStorage.removeItem('designcraft_firebase_config');
                this.localMode = true;
                this.isFirebaseInitialized = false;
                this.user = null;
                this.updateAuthUi(null);
                this.modalConfig.classList.add('hidden');
                alert("Reset successfully to Local Offline Mode.");
                return;
            }

            const config = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
            localStorage.setItem('designcraft_firebase_config', JSON.stringify(config));
            this.initializeFirebase(config);
            this.modalConfig.classList.add('hidden');
            alert("Firebase configuration saved and connected successfully!");
        });

        // MCP Modal wiring
        document.getElementById('btn-mcp-connect')?.addEventListener('click', () => {
            document.getElementById('modal-mcp')?.classList.remove('hidden');
        });
        document.getElementById('modal-mcp-close')?.addEventListener('click', () => {
            document.getElementById('modal-mcp')?.classList.add('hidden');
        });
        document.getElementById('mcp-copy-btn')?.addEventListener('click', () => {
            const url = document.getElementById('mcp-endpoint-url')?.value;
            if (url) navigator.clipboard.writeText(url).then(() => {
                const btn = document.getElementById('mcp-copy-btn');
                if (btn) btn.innerHTML = '<i data-lucide="check"></i>';
                lucide.createIcons();
                setTimeout(() => { if (btn) btn.innerHTML = '<i data-lucide="copy"></i>'; lucide.createIcons(); }, 2000);
            });
        });
    }

    showAuthError(msg) {
        this.authErrorBox.innerText = msg;
        this.authErrorBox.classList.remove('hidden');
    }

    resetAuthForm() {
        this.authForm.reset();
        this.authErrorBox.classList.add('hidden');
    }

    populateConfigForm() {
        const savedConfig = localStorage.getItem('designcraft_firebase_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (document.getElementById('fb-apiKey')) document.getElementById('fb-apiKey').value = config.apiKey || '';
            if (document.getElementById('fb-authDomain')) document.getElementById('fb-authDomain').value = config.authDomain || '';
            if (document.getElementById('fb-projectId')) document.getElementById('fb-projectId').value = config.projectId || '';
            if (document.getElementById('fb-storageBucket')) document.getElementById('fb-storageBucket').value = config.storageBucket || '';
            if (document.getElementById('fb-messagingSenderId')) document.getElementById('fb-messagingSenderId').value = config.messagingSenderId || '';
            if (document.getElementById('fb-appId')) document.getElementById('fb-appId').value = config.appId || '';
        }
    }

    // PROJECT DATABASE OPERATIONS

    // Save Design logic
    async saveCurrentProject() {
        const name = prompt("Enter a name for this design:", this.activeProjectName || "My Beautiful Design");
        if (name === null) return; // cancelled
        
        const designName = name.trim() || "Untitled Design";
        this.activeProjectName = designName;

        const htmlContent = window.canvasEditor.getSnapshot();
        const canvasBg = document.getElementById('paint-artboard')?.style.backgroundColor || "#121216";
        const timestamp = Date.now();

        const designData = {
            name: designName,
            htmlContent: htmlContent,
            canvasBg: canvasBg,
            updatedAt: timestamp
        };

        if (!this.localMode && this.user) {
            // Save to Firestore
            try {
                this.btnSave.disabled = true;
                this.btnSave.innerText = "Saving...";
                
                // Save to collection 'designs'
                await this.db.collection('designs').add({
                    ...designData,
                    userId: this.user.uid
                });
                
                alert(`"${designName}" saved successfully in Firebase Cloud!`);
            } catch (err) {
                console.error("Firestore save failed", err);
                alert("Cloud save failed. Saving locally to your browser instead.");
                this.saveLocally(designData);
            } finally {
                this.btnSave.disabled = false;
                this.btnSave.innerHTML = '<i data-lucide="save"></i> Save';
                lucide.createIcons();
            }
        } else {
            // Save locally
            this.saveLocally(designData);
            alert(`"${designName}" saved locally in browser storage!`);
        }
    }

    // Save to LocalStorage fallback helper
    saveLocally(data) {
        let localDesigns = [];
        const saved = localStorage.getItem('designcraft_local_designs');
        if (saved) {
            try { localDesigns = JSON.parse(saved); } catch (e) {}
        }
        
        // Add new design or override if matches name
        const matchIdx = localDesigns.findIndex(d => d.name === data.name);
        if (matchIdx !== -1) {
            localDesigns[matchIdx] = data;
        } else {
            localDesigns.push({
                ...data,
                id: `local-${Date.now()}`
            });
        }
        
        localStorage.setItem('designcraft_local_designs', JSON.stringify(localDesigns));
    }

    // Fetch and load list into UI
    async loadAndRenderProjects() {
        const tableBody = document.getElementById('projects-table-body');
        tableBody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align:center;">Loading designs...</td></tr>';

        let list = [];

        if (!this.localMode && this.user) {
            try {
                const snapshot = await this.db.collection('designs')
                    .where('userId', '==', this.user.uid)
                    .orderBy('updatedAt', 'desc')
                    .get();
                
                snapshot.forEach(doc => {
                    list.push({
                        id: doc.id,
                        ...doc.data(),
                        isCloud: true
                    });
                });
            } catch (err) {
                console.error("Error loading cloud designs", err);
            }
        }

        // Also fetch local designs
        const localSaved = localStorage.getItem('designcraft_local_designs');
        if (localSaved) {
            try {
                const localList = JSON.parse(localSaved);
                localList.forEach(d => {
                    list.push({
                        ...d,
                        isCloud: false
                    });
                });
            } catch (e) {}
        }

        // Render projects
        if (list.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="padding: 30px; text-align:center; color:var(--text-muted);">No saved designs found. Start designing and click "Save"!</td></tr>';
            return;
        }

        // Sort combined list by date
        list.sort((a,b) => b.updatedAt - a.updatedAt);

        tableBody.innerHTML = '';
        list.forEach(project => {
            const dateStr = new Date(project.updatedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const databaseIndicator = project.isCloud ? '<span style="color:#38bdf8; font-size:10px; margin-left:8px; border:1px solid #38bdf8; border-radius:4px; padding:1px 4px;">Cloud</span>' : '<span style="color:#a855f7; font-size:10px; margin-left:8px; border:1px solid #a855f7; border-radius:4px; padding:1px 4px;">Local</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 12px 20px;" class="project-name-cell">${project.name} ${databaseIndicator}</td>
                <td style="padding: 12px 20px;" class="project-date-cell">${dateStr}</td>
                <td style="padding: 12px 20px; text-align:right;" class="project-action-cell">
                    <button class="btn-icon load" title="Load Design" data-id="${project.id}">
                        <i data-lucide="play"></i>
                    </button>
                    <button class="btn-icon delete" title="Delete Design" data-id="${project.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;

            // Action triggers
            tr.querySelector('.load').addEventListener('click', () => {
                this.loadProjectIntoCanvas(project);
                this.modalProjects.classList.add('hidden');
            });

            tr.querySelector('.delete').addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                    await this.deleteProject(project);
                    this.loadAndRenderProjects();
                }
            });

            tableBody.appendChild(tr);
        });
        lucide.createIcons();
    }

    loadProjectIntoCanvas(project) {
        this.activeProjectName = project.name;
        // Paint onto artboard
        window.canvasEditor.loadSnapshot(project.htmlContent);
        
        // Sync Background
        const artboard = document.getElementById('paint-artboard');
        artboard.style.backgroundColor = project.canvasBg || '#121216';
        
        const picker = document.getElementById('prop-canvas-bg');
        const hex = document.getElementById('prop-canvas-bg-hex');
        const activeHex = window.controlsManager.rgbToHex(project.canvasBg || '#121216');
        if (picker) picker.value = activeHex;
        if (hex) hex.value = activeHex;
        
        window.canvasEditor.triggerHistorySave();
    }

    async deleteProject(project) {
        if (project.isCloud) {
            try {
                await this.db.collection('designs').doc(project.id).delete();
            } catch (err) {
                console.error("Firestore deletion failed", err);
            }
        } else {
            const saved = localStorage.getItem('designcraft_local_designs');
            if (saved) {
                try {
                    let localList = JSON.parse(saved);
                    localList = localList.filter(d => d.id !== project.id);
                    localStorage.setItem('designcraft_local_designs', JSON.stringify(localList));
                } catch (e) {}
            }
        }
    }
}

// Export singleton instance
window.firebaseService = new FirebaseService();


/* --- js/history.js --- */
/* DesignCraft History Manager
   Provides Undo and Redo operations by keeping snapshots of the canvas HTML. */

class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 50; // Limit history size
    }

    // Save a new state
    saveState(stateHtml) {
        // If state is the same as the last one, do nothing
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === stateHtml) {
            return;
        }
        
        this.undoStack.push(stateHtml);
        this.redoStack = []; // Clear redo stack on new action
        
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift(); // Remove oldest
        }
        this.updateButtons();
    }

    // Perform Undo
    undo(currentStateHtml) {
        if (this.undoStack.length === 0) return null;
        
        // Push current state to redo
        this.redoStack.push(currentStateHtml);
        
        // Pop previous state
        const prevState = this.undoStack.pop();
        this.updateButtons();
        return prevState;
    }

    // Perform Redo
    redo(currentStateHtml) {
        if (this.redoStack.length === 0) return null;
        
        // Push current state to undo
        this.undoStack.push(currentStateHtml);
        
        // Pop next state
        const nextState = this.redoStack.pop();
        this.updateButtons();
        return nextState;
    }

    // Clear history
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }

    // Enable/disable UI buttons
    updateButtons() {
        const undoBtn = document.getElementById('action-undo');
        const redoBtn = document.getElementById('action-redo');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.style.opacity = this.undoStack.length === 0 ? '0.4' : '1';
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.style.opacity = this.redoStack.length === 0 ? '0.4' : '1';
        }
    }
}

// Export singleton instance
window.historyManager = new HistoryManager();


/* --- js/canvas.js --- */
/* DesignCraft Canvas Editor
   Manages elements selection, movement, resizing, snapping, layer ordering, and double-click text editing. */

class CanvasEditor {
    constructor() {
        this.artboard = document.getElementById('paint-artboard');
        this.selectionBox = document.getElementById('selection-box');
        this.zoomPercent = document.getElementById('zoom-percent');
        this.coordDisplay = document.getElementById('element-coord');
        this.countDisplay = document.getElementById('canvas-elements-count');
        
        this.selectedElement = null;
        this.zoomLevel = 1.0;
        this.isDragging = false;
        this.isResizing = false;
        this.activeHandle = null;
        
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startLeft = 0;
        this.startTop = 0;
        
        this.snapThreshold = 8; // Pixels
        this.elementCounter = 0;
        this.clipboard = null;
        
        this.initEvents();
    }

    initEvents() {
        // Selection/Click-off
        this.artboard?.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
        
        // Double-click for text edit
        this.artboard?.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Key bindings (Delete element, Copy/Paste)
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Zoom bindings
        document.getElementById('zoom-in')?.addEventListener('click', () => this.adjustZoom(0.1));
        document.getElementById('zoom-out')?.addEventListener('click', () => this.adjustZoom(-0.1));
        
        // Alignments
        document.getElementById('order-to-front')?.addEventListener('click', () => this.bringToFront());
        document.getElementById('order-forward')?.addEventListener('click', () => this.moveForward());
        document.getElementById('order-backward')?.addEventListener('click', () => this.moveBackward());
        document.getElementById('order-to-back')?.addEventListener('click', () => this.sendToBack());

        document.getElementById('align-left')?.addEventListener('click', () => this.alignElement('left'));
        document.getElementById('align-center')?.addEventListener('click', () => this.alignElement('center'));
        document.getElementById('align-right')?.addEventListener('click', () => this.alignElement('right'));
        document.getElementById('align-top')?.addEventListener('click', () => this.alignElement('top'));
        document.getElementById('align-middle')?.addEventListener('click', () => this.alignElement('middle'));
        document.getElementById('align-bottom')?.addEventListener('click', () => this.alignElement('bottom'));

        // Dynamic 3D Tilt interaction delegated on the artboard
        this.artboard?.addEventListener('mousemove', (e) => {
            const tiltCheckbox = document.getElementById('ai-enable-tilt');
            if (tiltCheckbox && !tiltCheckbox.checked) return;

            const el = e.target.closest('.canvas-element');
            if (!el || this.isDragging || this.isResizing || el.classList.contains('editing')) return;
            
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const midX = rect.width / 2;
            const midY = rect.height / 2;
            
            const maxTilt = 10; // degrees
            const tiltY = ((x - midX) / midX) * maxTilt;
            const tiltX = -((y - midY) / midY) * maxTilt;
            
            el.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            el.style.transition = 'transform 0.05s ease';
            el.style.transformStyle = 'preserve-3d';
        });

        // Toggle listener to clear tilt styles instantly when disabled
        const tiltCheckbox = document.getElementById('ai-enable-tilt');
        if (tiltCheckbox) {
            tiltCheckbox?.addEventListener('change', () => {
                if (!tiltCheckbox.checked) {
                    document.querySelectorAll('.canvas-element')?.forEach(el => {
                        el.style.transform = '';
                    });
                }
            });
        }
        
        this.artboard?.addEventListener('mouseout', (e) => {
            const tiltCheckbox = document.getElementById('ai-enable-tilt');
            if (tiltCheckbox && !tiltCheckbox.checked) return;
            const el = e.target.closest('.canvas-element');
            if (!el) return;
            el.style.transform = '';
            el.style.transition = 'transform 0.25s ease';
        });
    }

    // Add Shape Element
    addShape(shapeType) {
        const el = document.createElement('div');
        el.className = 'canvas-element';
        el.id = `el-${Date.now()}`;
        el.dataset.type = 'shape';
        el.dataset.shape = shapeType;
        el.dataset.name = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} ${++this.elementCounter}`;
        
        // Set standard shape positioning and base design
        el.style.left = '100px';
        el.style.top = '100px';
        el.style.width = '150px';
        el.style.height = '150px';
        el.style.backgroundColor = '#6366f1';
        el.style.color = '#ffffff';
        el.style.zIndex = this.getMaxZIndex() + 1;
        
        // Shape clips
        if (shapeType === 'circle') {
            el.style.borderRadius = '50%';
        } else if (shapeType === 'triangle') {
            el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        } else if (shapeType === 'star') {
            el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        } else if (shapeType === 'blob') {
            el.style.borderRadius = '60% 40% 30% 70% / 60% 30% 70% 40%';
        } else if (shapeType === 'rectangle') {
            // Plain rectangle — no clip, no special radius. borderRadius left at default 0.
            el.style.borderRadius = '4px';
        } else if (shapeType === 'line') {
            el.style.width = '200px';
            el.style.height = '3px';
            el.style.borderRadius = '0';
        }
        
        this.artboard.appendChild(el);
        this.selectElement(el);
        this.triggerHistorySave();
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    // Add Text Element
    addText(textString = 'Double-click to Edit') {
        const el = document.createElement('div');
        el.className = 'canvas-element text-element';
        el.id = `el-${Date.now()}`;
        el.dataset.type = 'text';
        el.dataset.name = `Text ${++this.elementCounter}`;
        el.innerText = textString;
        
        el.style.left = '100px';
        el.style.top = '100px';
        el.style.width = '240px';
        el.style.height = 'auto';
        el.style.fontSize = '24px';
        el.style.fontFamily = "'Outfit', sans-serif";
        el.style.fontWeight = '600';
        el.style.color = '#ffffff';
        el.style.zIndex = this.getMaxZIndex() + 1;
        
        this.artboard.appendChild(el);
        this.selectElement(el);
        this.triggerHistorySave();
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    // Selection logic
    selectElement(el) {
        if (this.selectedElement === el) return;
        
        // De-select old
        this.deselectAll();
        
        if (el && el.classList.contains('canvas-element')) {
            this.selectedElement = el;
            el.setAttribute('data-selected', 'true');
            this.updateSelectionBox();
            
            // Sync Property Inspector sidebar
            if (window.controlsManager) {
                window.controlsManager.syncInspector(el);
            }
        }
    }

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.removeAttribute('data-selected');
        }
        this.selectedElement = null;
        this.selectionBox.classList.add('hidden');
        
        // Sync empty Property Inspector
        if (window.controlsManager) {
            window.controlsManager.syncInspector(null);
        }
        
        // Remove guides
        this.hideGuides();
    }

    updateSelectionBox() {
        if (!this.selectedElement) {
            this.selectionBox.classList.add('hidden');
            return;
        }
        
        const el = this.selectedElement;
        
        // Position Selection Box directly overlaying the element
        this.selectionBox.style.left = el.style.left;
        this.selectionBox.style.top = el.style.top;
        this.selectionBox.style.width = el.style.width;
        this.selectionBox.style.height = el.style.height;
        this.selectionBox.style.transform = el.style.transform;
        
        this.selectionBox.classList.remove('hidden');
        
        // Update Coordinates
        const left = parseInt(el.style.left);
        const top = parseInt(el.style.top);
        this.coordDisplay.innerText = `X: ${left}px, Y: ${top}px`;
    }

    // Handles mousedown on Canvas elements & handles
    handleMouseDown(e) {
        // If clicking on resize handles
        if (e.target.classList.contains('resize-handle')) {
            e.stopPropagation();
            this.isResizing = true;
            this.activeHandle = e.target.dataset.handle;
            
            this.startX = e.clientX;
            this.startY = e.clientY;
            
            this.startWidth = parseInt(this.selectedElement.style.width);
            this.startHeight = parseInt(this.selectedElement.style.height);
            this.startLeft = parseInt(this.selectedElement.style.left);
            this.startTop = parseInt(this.selectedElement.style.top);
            return;
        }
        
        // Clicked canvas element
        const clickedEl = e.target.closest('.canvas-element');
        if (clickedEl) {
            e.stopPropagation();
            
            // Do not break editing if user clicks inside active textarea
            if (clickedEl.querySelector('.editing-input-active')) return;
            
            this.selectElement(clickedEl);
            
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startLeft = parseInt(clickedEl.style.left);
            this.startTop = parseInt(clickedEl.style.top);
            return;
        }
        
        // Alignment and Layer controls
        const getEl = (id) => document.getElementById(id);
        
        getEl('order-to-front')?.addEventListener('click', () => this.reorderElement('front'));
        getEl('order-forward')?.addEventListener('click', () => this.reorderElement('forward'));
        getEl('order-backward')?.addEventListener('click', () => this.reorderElement('backward'));
        getEl('order-to-back')?.addEventListener('click', () => this.reorderElement('back'));
        
        getEl('align-left')?.addEventListener('click', () => this.alignElement('left'));
        getEl('align-center')?.addEventListener('click', () => this.alignElement('center'));
        getEl('align-right')?.addEventListener('click', () => this.alignElement('right'));
        getEl('align-top')?.addEventListener('click', () => this.alignElement('top'));
        getEl('align-middle')?.addEventListener('click', () => this.alignElement('middle'));
        getEl('align-bottom')?.addEventListener('click', () => this.alignElement('bottom'));

        // Handle clicks outside to deselects -> Deselect
        this.deselectAll();
    }

    // Handles dragging & resizing movements
    handleMouseMove(e) {
        if (!this.selectedElement) return;
        
        const deltaX = (e.clientX - this.startX) / this.zoomLevel;
        const deltaY = (e.clientY - this.startY) / this.zoomLevel;
        
        if (this.isDragging) {
            let newLeft = Math.round(this.startLeft + deltaX);
            let newTop = Math.round(this.startTop + deltaY);
            
            // Snapping to margins & coordinates
            const snapped = this.checkSnapping(newLeft, newTop);
            newLeft = snapped.x;
            newTop = snapped.y;
            
            this.selectedElement.style.left = `${newLeft}px`;
            this.selectedElement.style.top = `${newTop}px`;
            this.updateSelectionBox();
            
            // Sync values to sidebar size fields
            const propW = document.getElementById('prop-width');
            const propH = document.getElementById('prop-height');
            if (propW) propW.value = parseInt(this.selectedElement.style.width);
            if (propH) propH.value = parseInt(this.selectedElement.style.height);
        }
        
        if (this.isResizing) {
            let newWidth = this.startWidth;
            let newHeight = this.startHeight;
            let newLeft = this.startLeft;
            let newTop = this.startTop;
            
            const handle = this.activeHandle;
            
            // Compute Resizing metrics
            if (handle.includes('r')) {
                newWidth = Math.max(10, Math.round(this.startWidth + deltaX));
            }
            if (handle.includes('b')) {
                newHeight = Math.max(10, Math.round(this.startHeight + deltaY));
            }
            if (handle.includes('l')) {
                const computedWidth = this.startWidth - deltaX;
                if (computedWidth > 10) {
                    newWidth = Math.round(computedWidth);
                    newLeft = Math.round(this.startLeft + deltaX);
                }
            }
            if (handle.includes('t')) {
                const computedHeight = this.startHeight - deltaY;
                if (computedHeight > 10) {
                    newHeight = Math.round(computedHeight);
                    newTop = Math.round(this.startTop + deltaY);
                }
            }
            
            this.selectedElement.style.width = `${newWidth}px`;
            this.selectedElement.style.height = `${newHeight}px`;
            this.selectedElement.style.left = `${newLeft}px`;
            this.selectedElement.style.top = `${newTop}px`;
            this.updateSelectionBox();
            
            // Sync values to sidebar size fields
            const propW = document.getElementById('prop-width');
            const propH = document.getElementById('prop-height');
            if (propW) propW.value = newWidth;
            if (propH) propH.value = newHeight;
        }
    }

    handleMouseUp() {
        if (this.isDragging || this.isResizing) {
            this.isDragging = false;
            this.isResizing = false;
            this.activeHandle = null;
            this.hideGuides();
            this.triggerHistorySave();
            
            // Trigger layers list reorder syncing in sidebar if element dragged
            if (window.controlsManager) {
                window.controlsManager.updateLayersList();
            }
        }
    }

    // Check snapping coordinates relative to artboard boundaries & other elements
    checkSnapping(x, y) {
        let snappedX = x;
        let snappedY = y;
        let showXGuide = false;
        let showYGuide = false;
        
        const elWidth = parseInt(this.selectedElement.style.width);
        const elHeight = parseInt(this.selectedElement.style.height);
        
        const artboardW = parseInt(this.artboard.style.width);
        const artboardH = parseInt(this.artboard.style.height);
        
        // 1. Check Artboard Boundary & Center Snapping
        const guides = {
            vertical: [0, artboardW / 2 - elWidth / 2, artboardW - elWidth],
            horizontal: [0, artboardH / 2 - elHeight / 2, artboardH - elHeight]
        };
        
        // Vertical Snapping (X coord)
        for (const snapVal of guides.vertical) {
            if (Math.abs(x - snapVal) < this.snapThreshold) {
                snappedX = snapVal;
                showYGuide = true;
                const guideY = document.getElementById('guide-y');
                guideY.style.left = `${snappedX + elWidth / 2}px`;
                break;
            }
        }
        
        // Horizontal Snapping (Y coord)
        for (const snapVal of guides.horizontal) {
            if (Math.abs(y - snapVal) < this.snapThreshold) {
                snappedY = snapVal;
                showXGuide = true;
                const guideX = document.getElementById('guide-x');
                guideX.style.top = `${snappedY + elHeight / 2}px`;
                break;
            }
        }
        
        // Display guides
        document.getElementById('guide-x')?.classList.toggle('hidden', !showXGuide);
        document.getElementById('guide-y')?.classList.toggle('hidden', !showYGuide);
        
        return { x: snappedX, y: snappedY };
    }

    hideGuides() {
        document.getElementById('guide-x')?.classList.add('hidden');
        document.getElementById('guide-y')?.classList.add('hidden');
    }

    // Double-click text box to edit text in place
    handleDoubleClick(e) {
        const textEl = e.target.closest('.text-element');
        if (!textEl) return;
        
        e.stopPropagation();
        this.deselectAll();
        
        const originalText = textEl.innerText;
        textEl.innerText = '';
        
        // Create matching textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'editing-input-active';
        textarea.value = originalText;
        
        // Match CSS details
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.fontFamily = textEl.style.fontFamily;
        textarea.style.fontSize = textEl.style.fontSize;
        textarea.style.fontWeight = textEl.style.fontWeight;
        textarea.style.color = textEl.style.color;
        textarea.style.textAlign = textEl.style.textAlign || 'left';
        
        textEl.appendChild(textarea);
        textarea.focus();
        
        // Autosize helper
        textarea.style.height = `${textarea.scrollHeight}px`;
        
        const finishEdit = () => {
            const newText = textarea.value.trim() === '' ? originalText : textarea.value;
            textEl.innerHTML = '';
            textEl.innerText = newText;
            
            // Re-select element
            this.selectElement(textEl);
            this.triggerHistorySave();
        };
        
        textarea?.addEventListener('blur', finishEdit);
        textarea?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                textarea.blur();
            }
            if (e.key === 'Escape') {
                textarea.value = originalText;
                textarea.blur();
            }
        });
    }

    // Delete or Copy/Paste key binds
    handleKeyDown(e) {
        // Prevent action if in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('contenteditable') === 'true') {
            return;
        }
        
        // Delete element
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedElement) {
            e.preventDefault();
            const elToDelete = this.selectedElement;
            this.deselectAll();
            elToDelete.remove();
            
            this.triggerHistorySave();
            this.updateElementsCount();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
        
        // Copy (Ctrl+C)
        if (e.ctrlKey && e.key.toLowerCase() === 'c' && this.selectedElement) {
            e.preventDefault();
            this.clipboard = this.selectedElement.cloneNode(true);
            this.clipboard.removeAttribute('data-selected');
        }
        
        // Paste (Ctrl+V)
        if (e.ctrlKey && e.key.toLowerCase() === 'v' && this.clipboard) {
            e.preventDefault();
            const clone = this.clipboard.cloneNode(true);
            clone.id = `el-${Date.now()}`;
            clone.style.left = `${parseInt(clone.style.left) + 20}px`;
            clone.style.top = `${parseInt(clone.style.top) + 20}px`;
            clone.dataset.name = clone.dataset.name + ' Copy';
            
            this.artboard.appendChild(clone);
            this.selectElement(clone);
            
            this.triggerHistorySave();
            this.updateElementsCount();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
        
        // Undo (Ctrl+Z)
        if (e.ctrlKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            document.getElementById('action-undo').click();
        }
        
        // Redo (Ctrl+Y)
        if (e.ctrlKey && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            document.getElementById('action-redo').click();
        }
    }

    // Zoom adjust
    adjustZoom(amount) {
        this.zoomLevel = Math.max(0.2, Math.min(3.0, this.zoomLevel + amount));
        this.artboard.style.transform = `scale(${this.zoomLevel})`;
        this.zoomPercent.innerText = `${Math.round(this.zoomLevel * 100)}%`;
        this.updateSelectionBox();
    }

    // Get max z-index
    getMaxZIndex() {
        let max = 0;
        const elements = this.artboard.querySelectorAll('.canvas-element');
        elements.forEach(el => {
            const z = parseInt(el.style.zIndex) || 0;
            if (z > max) max = z;
        });
        return max;
    }

    // Z-Index ordering
    bringToFront() {
        if (!this.selectedElement) return;
        this.artboard.appendChild(this.selectedElement);
        this.updateSelectionBox();
        this.triggerHistorySave();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    sendToBack() {
        if (!this.selectedElement) return;
        this.artboard.insertBefore(this.selectedElement, this.artboard.firstChild);
        this.updateSelectionBox();
        this.triggerHistorySave();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    moveForward() {
        if (!this.selectedElement) return;
        const next = this.selectedElement.nextElementSibling;
        // Skip selection box and guide lines which are at bottom
        if (next && next.classList.contains('canvas-element')) {
            this.artboard.insertBefore(next, this.selectedElement);
            this.updateSelectionBox();
            this.triggerHistorySave();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
    }

    moveBackward() {
        if (!this.selectedElement) return;
        const prev = this.selectedElement.previousElementSibling;
        if (prev && prev.classList.contains('canvas-element')) {
            this.artboard.insertBefore(this.selectedElement, prev);
            this.updateSelectionBox();
            this.triggerHistorySave();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
    }

    alignElement(alignment) {
        if (!this.selectedElement) return;

        const el = this.selectedElement;
        const parent = el.parentElement || this.artboard;
        
        const parentWidth = parent.clientWidth || parent.offsetWidth;
        const parentHeight = parent.clientHeight || parent.offsetHeight;
        
        const elWidth = el.offsetWidth;
        const elHeight = el.offsetHeight;
        
        switch (alignment) {
            case 'left':
                el.style.left = '0px';
                break;
            case 'center':
                el.style.left = Math.round((parentWidth - elWidth) / 2) + 'px';
                break;
            case 'right':
                el.style.left = Math.round(parentWidth - elWidth) + 'px';
                break;
            case 'top':
                el.style.top = '0px';
                break;
            case 'middle':
                el.style.top = Math.round((parentHeight - elHeight) / 2) + 'px';
                break;
            case 'bottom':
                el.style.top = Math.round(parentHeight - elHeight) + 'px';
                break;
        }

        this.updateSelectionBox();
        this.triggerHistorySave();
    }

    // Count updates
    updateElementsCount() {
        const count = this.artboard.querySelectorAll('.canvas-element').length;
        this.countDisplay.innerText = `${count} Element${count === 1 ? '' : 's'}`;
    }

    // State HTML representation for undo/redo snapshots
    getSnapshot() {
        // Clone and strip selections
        const clone = this.artboard.cloneNode(true);
        // Remove guides & selection box from snapshot
        const helpers = clone.querySelectorAll('.selection-overlay, .guide-line');
        helpers.forEach(h => h.remove());
        
        // Remove selected tags
        const selected = clone.querySelectorAll('[data-selected="true"]');
        selected.forEach(s => s.removeAttribute('data-selected'));
        
        return clone.innerHTML;
    }

    loadSnapshot(htmlContent) {
        // Keep helpers
        const selectionBoxHtml = this.selectionBox.outerHTML;
        const guideXHtml = document.getElementById('guide-x').outerHTML;
        const guideYHtml = document.getElementById('guide-y').outerHTML;
        
        this.artboard.innerHTML = htmlContent;
        
        // Append helpers back
        const parser = new DOMParser();
        this.artboard.appendChild(parser.parseFromString(selectionBoxHtml, 'text/html').body.firstChild);
        this.artboard.appendChild(parser.parseFromString(guideXHtml, 'text/html').body.firstChild);
        this.artboard.appendChild(parser.parseFromString(guideYHtml, 'text/html').body.firstChild);
        
        // Re-hook local refs
        this.selectionBox = document.getElementById('selection-box');
        
        // Reselect if applicable
        const active = this.artboard.querySelector('[data-selected="true"]');
        if (active) {
            this.selectedElement = active;
            this.updateSelectionBox();
        } else {
            this.deselectAll();
        }
        
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    reorderElement(action) {
        if (!this.selectedElement) return;
        
        const el = this.selectedElement;
        const currentZ = parseInt(window.getComputedStyle(el).zIndex) || 1;
        
        if (action === 'front') el.style.zIndex = 999;
        if (action === 'forward') el.style.zIndex = currentZ + 1;
        if (action === 'backward') el.style.zIndex = Math.max(0, currentZ - 1);
        if (action === 'back') el.style.zIndex = 0;
        
        this.triggerHistorySave();
    }

    alignElement(alignment) {
        if (!this.selectedElement) return;
        
        const el = this.selectedElement;
        const parentW = this.artboard.offsetWidth;
        const parentH = this.artboard.offsetHeight;
        const elW = el.offsetWidth;
        const elH = el.offsetHeight;
        
        switch (alignment) {
            case 'left': el.style.left = '0px'; break;
            case 'center': el.style.left = `${(parentW - elW) / 2}px`; break;
            case 'right': el.style.left = `${parentW - elW}px`; break;
            case 'top': el.style.top = '0px'; break;
            case 'middle': el.style.top = `${(parentH - elH) / 2}px`; break;
            case 'bottom': el.style.top = `${parentH - elH}px`; break;
        }
        
        this.updateSelectionBox();
        this.triggerHistorySave();
    }

    triggerHistorySave() {
        const snapshot = this.getSnapshot();
        window.historyManager.saveState(snapshot);
    }
}

// Export singleton instance
window.canvasEditor = new CanvasEditor();


/* --- js/controls.js --- */
/* DesignCraft Property Inspector & Panel Controls
   Manages tab navigation, links HTML input controls to canvas elements, 
   manages layers panel, color swatches, animations, and preset styles. */

class ControlsManager {
    constructor() {
        this.activeElement = null;
        this.initTabs();
        this.initInspectorListeners();
        this.initPresetListeners();
        this.initSwatchListeners();
    }

    // Tab switcher layout
    initTabs() {
        // Main tabs
        document.querySelectorAll('.sidebar-tabs')?.forEach(container => {
            container?.addEventListener('click', (e) => {
                const btn = e.target.closest('.tab-btn');
                if (!btn) return;
                
                const tabGroup = btn.parentElement;
                const tabId = btn.dataset.tab;
                
                // Active button toggle
                tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Content toggle
                const tabContents = tabGroup.nextElementSibling;
                tabContents.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === tabId);
                });
            });
        });

        // Color categories selector
        document.querySelectorAll('.swatches-tabs')?.forEach(container => {
            container?.addEventListener('click', (e) => {
                const btn = e.target.closest('.swatch-tab-btn');
                if (!btn) return;
                
                const group = btn.parentElement;
                group.querySelectorAll('.swatch-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const cat = btn.dataset.swatchCat;
                document.getElementById('swatches-solid')?.classList.toggle('active', cat === 'solid');
                document.getElementById('swatches-gradient')?.classList.toggle('active', cat === 'gradient');
            });
        });
    }

    // Sync input controls with selected element styles
    syncInspector(el) {
        this.activeElement = el;
        
        const noSelMsg = document.getElementById('editor-no-selection');
        const controls = document.getElementById('editor-controls');
        
        if (!el) {
            noSelMsg.classList.remove('hidden');
            controls.classList.add('hidden');
            return;
        }
        
        noSelMsg.classList.add('hidden');
        controls.classList.remove('hidden');
        
        // 1. Dimensions
        if (document.getElementById('prop-width')) document.getElementById('prop-width').value = parseInt(el.style.width) || 100;
        if (document.getElementById('prop-height')) document.getElementById('prop-height').value = parseInt(el.style.height) || 100;
        
        // 2. Typography display (Only toggle visible for Text element)
        const typoSection = document.getElementById('section-typography');
        const isText = el.classList.contains('text-element');
        typoSection.classList.toggle('hidden', !isText);
        
        if (isText) {
            // Typography values
            const family = el.style.fontFamily || "'Outfit', sans-serif";
            if (document.getElementById('prop-font-family')) document.getElementById('prop-font-family').value = family.replace(/"/g, "'");
            if (document.getElementById('prop-font-size')) document.getElementById('prop-font-size').value = parseInt(el.style.fontSize) || 16;
            if (document.getElementById('prop-font-weight')) document.getElementById('prop-font-weight').value = el.style.fontWeight || "400";
            
            const textColor = el.style.color || "#ffffff";
            const hexColor = this.rgbToHex(textColor) || "#ffffff";
            if (document.getElementById('prop-text-color')) document.getElementById('prop-text-color').value = hexColor;
            if (document.getElementById('prop-text-color-hex')) document.getElementById('prop-text-color-hex').value = hexColor;
            
            if (document.getElementById('prop-text-align')) document.getElementById('prop-text-align').value = el.style.textAlign || "left";
        }
        
        // 3. Background type
        const bg = el.style.background || el.style.backgroundColor || "";
        const bgTypeInput = document.getElementById('prop-bg-type');
        
        if (bg.includes('gradient')) {
            bgTypeInput.value = 'gradient';
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.remove('hidden');
            
            // Parse linear-gradient details
            const angleMatch = bg.match(/(\d+)deg/);
            if (angleMatch) if (document.getElementById('prop-grad-angle')) document.getElementById('prop-grad-angle').value = angleMatch[1];
            
            const colorsMatch = bg.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/g);
            if (colorsMatch && colorsMatch.length >= 2) {
                if (document.getElementById('prop-grad-color1')) document.getElementById('prop-grad-color1').value = this.rgbToHex(colorsMatch[0]);
                if (document.getElementById('prop-grad-color2')) document.getElementById('prop-grad-color2').value = this.rgbToHex(colorsMatch[1]);
            }
        } else if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
            bgTypeInput.value = 'transparent';
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.add('hidden');
        } else {
            bgTypeInput.value = 'color';
            document.getElementById('bg-color-control')?.classList.remove('hidden');
            document.getElementById('bg-gradient-control')?.classList.add('hidden');
            
            const baseColor = el.style.backgroundColor || "#6366f1";
            const hex = this.rgbToHex(baseColor) || "#6366f1";
            if (document.getElementById('prop-bg-color')) document.getElementById('prop-bg-color').value = hex;
            if (document.getElementById('prop-bg-color-hex')) document.getElementById('prop-bg-color-hex').value = hex;
            
            // Opacity slider
            const rgba = baseColor.match(/rgba?\(.*?,\s*.*?,.*?,\s*(.*?)\)/);
            if (document.getElementById('prop-bg-opacity')) document.getElementById('prop-bg-opacity').value = rgba ? parseFloat(rgba[1]) : 1.0;
        }
        
        // 4. Corners & Borders
        const radius = parseInt(el.style.borderRadius) || 0;
        if (document.getElementById('prop-border-radius')) document.getElementById('prop-border-radius').value = radius;
        document.getElementById('radius-val').innerText = radius;
        
        const borderWidth = parseInt(el.style.borderWidth) || 0;
        if (document.getElementById('prop-border-width')) document.getElementById('prop-border-width').value = borderWidth;
        if (document.getElementById('prop-border-style')) document.getElementById('prop-border-style').value = el.style.borderStyle || "none";
        
        const bColor = el.style.borderColor || "#000000";
        const bColorHex = this.rgbToHex(bColor) || "#000000";
        if (document.getElementById('prop-border-color')) document.getElementById('prop-border-color').value = bColorHex;
        if (document.getElementById('prop-border-color-hex')) document.getElementById('prop-border-color-hex').value = bColorHex;
        
        // 5. Shadows
        const shadow = el.style.boxShadow || "none";
        const shadowEnable = document.getElementById('prop-shadow-enable');
        const shadowGroup = document.getElementById('shadow-properties-container');
        
        if (shadow !== "none" && shadow !== "") {
            shadowEnable.checked = true;
            shadowGroup.classList.remove('disabled-group');
            
            // Parse shadow details (very simple parser)
            const inset = shadow.includes('inset');
            if (document.getElementById('prop-shadow-inset')) document.getElementById('prop-shadow-inset').checked = inset;
            
            const cleanShadow = shadow.replace('inset', '').trim();
            // Match digits
            const digits = cleanShadow.match(/-?\d+px/g);
            if (digits && digits.length >= 3) {
                if (document.getElementById('prop-shadow-x')) document.getElementById('prop-shadow-x').value = parseInt(digits[0]);
                if (document.getElementById('prop-shadow-y')) document.getElementById('prop-shadow-y').value = parseInt(digits[1]);
                if (document.getElementById('prop-shadow-blur')) document.getElementById('prop-shadow-blur').value = parseInt(digits[2]);
                if (digits[3]) if (document.getElementById('prop-shadow-spread')) document.getElementById('prop-shadow-spread').value = parseInt(digits[3]);
            }
            
            // Match color
            const colorMatch = cleanShadow.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/);
            if (colorMatch) {
                if (document.getElementById('prop-shadow-color')) document.getElementById('prop-shadow-color').value = this.rgbToHex(colorMatch[0]);
            }
        } else {
            shadowEnable.checked = false;
            shadowGroup.classList.add('disabled-group');
        }
        
        // 6. Transforms
        const transform = el.style.transform || "";
        let rotateVal = 0;
        let scaleVal = 1;
        let skewVal = 0;
        
        const rMatch = transform.match(/rotate\((\d+)deg\)/);
        if (rMatch) rotateVal = parseInt(rMatch[1]);
        
        const sMatch = transform.match(/scale\((.*?)\)/);
        if (sMatch) scaleVal = parseFloat(sMatch[1]);
        
        const skMatch = transform.match(/skewX\((\d+)deg\)/);
        if (skMatch) skewVal = parseInt(skMatch[1]);
        
        if (document.getElementById('prop-rotate')) document.getElementById('prop-rotate').value = rotateVal;
        document.getElementById('rotate-val').innerText = rotateVal;
        if (document.getElementById('prop-scale')) document.getElementById('prop-scale').value = scaleVal;
        if (document.getElementById('prop-skew-x')) document.getElementById('prop-skew-x').value = skewVal;
        
        // 7. Filters & Effects
        const filter = el.style.filter || "";
        let blurVal = 0;
        let brightVal = 100;
        
        const bMatch = filter.match(/blur\((\d+)px\)/);
        if (bMatch) blurVal = parseInt(bMatch[1]);
        
        const brMatch = filter.match(/brightness\((\d+)%\)/);
        if (brMatch) brightVal = parseInt(brMatch[1]);
        
        if (document.getElementById('prop-filter-blur')) document.getElementById('prop-filter-blur').value = blurVal;
        if (document.getElementById('prop-filter-brightness')) document.getElementById('prop-filter-brightness').value = brightVal;
        
        // Backdrop filter
        const backdrop = el.style.backdropFilter || el.style.webkitBackdropFilter || "";
        let backdropBlur = 0;
        const bdMatch = backdrop.match(/blur\((\d+)px\)/);
        if (bdMatch) backdropBlur = parseInt(bdMatch[1]);
        if (document.getElementById('prop-backdrop-blur')) document.getElementById('prop-backdrop-blur').value = backdropBlur;
        
        // 8. Animation values sync
        let currentAnimType = 'none';
        let animDuration = 2;
        let animInfinite = true;
        
        // Check animation classes
        el.classList.forEach(className => {
            if (className.startsWith('anim-')) {
                currentAnimType = className.replace('anim-', '');
            }
        });
        
        if (el.style.animationDuration) {
            animDuration = parseFloat(el.style.animationDuration) || 2;
        }
        if (el.style.animationIterationCount === '1') {
            animInfinite = false;
        }
        
        if (document.getElementById('prop-animation-type')) document.getElementById('prop-animation-type').value = currentAnimType;
        if (document.getElementById('prop-anim-duration')) document.getElementById('prop-anim-duration').value = animDuration;
        if (document.getElementById('prop-anim-infinite')) document.getElementById('prop-anim-infinite').checked = animInfinite;
        
        // --- NEW 50+ PROPERTIES SYNC ---
        // Spacing
        ['mt', 'mb', 'ml', 'mr', 'pt', 'pb', 'pl', 'pr'].forEach(prop => {
            const map = { mt:'marginTop', mb:'marginBottom', ml:'marginLeft', mr:'marginRight', pt:'paddingTop', pb:'paddingBottom', pl:'paddingLeft', pr:'paddingRight' };
            const val = parseInt(el.style[map[prop]]) || 0;
            const input = document.getElementById(`prop-${prop}`);
            if(input) input.value = val;
        });
        
        // Layout & Flexbox
        const display = el.style.display || 'block';
        const displayInput = document.getElementById('prop-display');
        if (displayInput) displayInput.value = display;
        const flexControls = document.getElementById('flexbox-controls');
        if (flexControls) flexControls.classList.toggle('hidden', display !== 'flex' && display !== 'inline-flex');
        
        ['flex-direction', 'flex-wrap', 'justify-content', 'align-items'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const val = el.style[camel] || '';
            const input = document.getElementById(`prop-${prop}`);
            if(input && val) input.value = val;
        });
        const gapInput = document.getElementById('prop-gap');
        if (gapInput) gapInput.value = parseInt(el.style.gap) || 0;

        // Position
        const posInput = document.getElementById('prop-position');
        if (posInput) posInput.value = el.style.position || 'static';
        ['top', 'bottom', 'left', 'right'].forEach(prop => {
            const val = el.style[prop] || '';
            const input = document.getElementById(`prop-${prop}`);
            if (input) input.value = val.replace('px', '');
        });
        const zIndexInput = document.getElementById('prop-z-index');
        if (zIndexInput) zIndexInput.value = el.style.zIndex || '';

        // Advanced CSS
        const opacityInput = document.getElementById('prop-opacity');
        if (opacityInput) opacityInput.value = el.style.opacity !== '' ? el.style.opacity : '1';
        
        ['mix-blend-mode', 'cursor', 'pointer-events', 'overflow'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const val = el.style[camel] || (prop==='pointer-events'||prop==='cursor'?'auto':(prop==='mix-blend-mode'?'normal':'visible'));
            const input = document.getElementById(`prop-${prop}`);
            if(input) input.value = val;
        });

        const customCssInput = document.getElementById('prop-custom-css');
        if (customCssInput) customCssInput.value = el.style.cssText.split(';').map(s => s.trim()).filter(Boolean).join(';\n') + ';';

        // Text Effects
        if (isText) {
            document.getElementById('section-text-effects')?.classList.remove('hidden');
            const ls = el.style.letterSpacing || 'normal';
            const lh = el.style.lineHeight || 'normal';
            const tt = el.style.textTransform || 'none';
            const td = el.style.textDecoration || 'none';
            if (document.getElementById('prop-letter-spacing')) if (document.getElementById('prop-letter-spacing')) document.getElementById('prop-letter-spacing').value = ls;
            if (document.getElementById('prop-line-height')) if (document.getElementById('prop-line-height')) document.getElementById('prop-line-height').value = lh;
            if (document.getElementById('prop-text-transform')) if (document.getElementById('prop-text-transform')) document.getElementById('prop-text-transform').value = tt;
            if (document.getElementById('prop-text-decoration')) if (document.getElementById('prop-text-decoration')) document.getElementById('prop-text-decoration').value = td;
        } else {
            document.getElementById('section-text-effects')?.classList.add('hidden');
        }

        // Filters extra
        let contrastVal = 100, saturateVal = 100, grayscaleVal = 0, hueRotateVal = 0;
        const contMatch = filter.match(/contrast\((\d+)%\)/); if (contMatch) contrastVal = parseInt(contMatch[1]);
        const satMatch = filter.match(/saturate\((\d+)%\)/); if (satMatch) saturateVal = parseInt(satMatch[1]);
        const grayMatch = filter.match(/grayscale\((\d+)%\)/); if (grayMatch) grayscaleVal = parseInt(grayMatch[1]);
        const hueMatch = filter.match(/hue-rotate\((\d+)deg\)/); if (hueMatch) hueRotateVal = parseInt(hueMatch[1]);
        
        if (document.getElementById('prop-filter-contrast')) if (document.getElementById('prop-filter-contrast')) document.getElementById('prop-filter-contrast').value = contrastVal;
        if (document.getElementById('prop-filter-saturate')) if (document.getElementById('prop-filter-saturate')) document.getElementById('prop-filter-saturate').value = saturateVal;
        if (document.getElementById('prop-filter-grayscale')) if (document.getElementById('prop-filter-grayscale')) document.getElementById('prop-filter-grayscale').value = grayscaleVal;
        if (document.getElementById('prop-filter-hue-rotate')) if (document.getElementById('prop-filter-hue-rotate')) document.getElementById('prop-filter-hue-rotate').value = hueRotateVal;
        
        // Backdrop Brightness
        let bdBright = 100;
        const bdBrMatch = backdrop.match(/brightness\((\d+)%\)/);
        if (bdBrMatch) bdBright = parseInt(bdBrMatch[1]);
        if (document.getElementById('prop-backdrop-brightness')) if (document.getElementById('prop-backdrop-brightness')) document.getElementById('prop-backdrop-brightness').value = bdBright;

        // Transitions
        const transProp = el.style.transitionProperty || 'all';
        const transDur = parseFloat(el.style.transitionDuration) || 0.3;
        const transTime = el.style.transitionTimingFunction || 'ease';
        
        if (document.getElementById('prop-transition-property')) if (document.getElementById('prop-transition-property')) document.getElementById('prop-transition-property').value = transProp;
        if (document.getElementById('prop-transition-duration')) if (document.getElementById('prop-transition-duration')) document.getElementById('prop-transition-duration').value = transDur;
        if (document.getElementById('prop-transition-timing')) if (document.getElementById('prop-transition-timing')) document.getElementById('prop-transition-timing').value = transTime;
    }

    // Set up inspector input handlers
    initInspectorListeners() {
        const updateStyle = (styleProp, value, historySave = false) => {
            if (!this.activeElement) return;
            this.activeElement.style[styleProp] = value;
            window.canvasEditor.updateSelectionBox();
            
            if (historySave) {
                window.canvasEditor.triggerHistorySave();
            }
        };

        // Dimensions
        document.getElementById('prop-width')?.addEventListener('input', (e) => {
            updateStyle('width', `${e.target.value}px`);
        });
        document.getElementById('prop-width')?.addEventListener('change', () => {
            window.canvasEditor.triggerHistorySave();
        });
        
        document.getElementById('prop-height')?.addEventListener('input', (e) => {
            updateStyle('height', `${e.target.value}px`);
        });
        document.getElementById('prop-height')?.addEventListener('change', () => {
            window.canvasEditor.triggerHistorySave();
        });

        // Typography
        document.getElementById('prop-font-family')?.addEventListener('change', (e) => {
            updateStyle('fontFamily', e.target.value, true);
        });
        document.getElementById('prop-font-size')?.addEventListener('input', (e) => {
            updateStyle('fontSize', `${e.target.value}px`);
        });
        document.getElementById('prop-font-size')?.addEventListener('change', () => {
            window.canvasEditor.triggerHistorySave();
        });
        document.getElementById('prop-font-weight')?.addEventListener('change', (e) => {
            updateStyle('fontWeight', e.target.value, true);
        });
        document.getElementById('prop-text-align')?.addEventListener('change', (e) => {
            updateStyle('textAlign', e.target.value, true);
        });

        // Text Colors sync
        const textColor = document.getElementById('prop-text-color');
        const textColorHex = document.getElementById('prop-text-color-hex');
        
        textColor?.addEventListener('input', (e) => {
            textColorHex.value = e.target.value;
            updateStyle('color', e.target.value);
        });
        textColor?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        textColorHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                textColor.value = e.target.value;
                updateStyle('color', e.target.value, true);
            }
        });

        // Background type changes
        const bgType = document.getElementById('prop-bg-type');
        bgType?.addEventListener('change', (e) => {
            const type = e.target.value;
            document.getElementById('bg-color-control')?.classList.toggle('hidden', type !== 'color');
            document.getElementById('bg-gradient-control')?.classList.toggle('hidden', type !== 'gradient');
            
            if (type === 'transparent') {
                updateStyle('background', 'transparent', true);
            } else if (type === 'color') {
                const color = document.getElementById('prop-bg-color')?.value;
                const opacity = document.getElementById('prop-bg-opacity')?.value;
                updateStyle('background', this.hexToRgba(color, opacity), true);
            } else if (type === 'gradient') {
                this.applyGradientStyle();
            }
        });

        // Solid background color changes
        const bgColor = document.getElementById('prop-bg-color');
        const bgColorHex = document.getElementById('prop-bg-color-hex');
        const bgOpacity = document.getElementById('prop-bg-opacity');
        
        const updateSolidBg = () => {
            const rgba = this.hexToRgba(bgColor.value, bgOpacity.value);
            updateStyle('background', rgba);
            updateStyle('backgroundColor', rgba); // fallback
        };
        
        bgColor?.addEventListener('input', (e) => {
            bgColorHex.value = e.target.value;
            updateSolidBg();
        });
        bgColor?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        bgOpacity?.addEventListener('input', updateSolidBg);
        bgOpacity?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        
        bgColorHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                bgColor.value = e.target.value;
                updateSolidBg();
                window.canvasEditor.triggerHistorySave();
            }
        });

        // Gradient Background Color changes
        const gradColor1 = document.getElementById('prop-grad-color1');
        const gradColor2 = document.getElementById('prop-grad-color2');
        const gradAngle = document.getElementById('prop-grad-angle');
        const gradType = document.getElementById('prop-grad-type');

        gradColor1?.addEventListener('input', () => this.applyGradientStyle());
        gradColor2?.addEventListener('input', () => this.applyGradientStyle());
        gradAngle?.addEventListener('input', () => this.applyGradientStyle());
        gradType?.addEventListener('change', () => this.applyGradientStyle());

        gradColor1?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        gradColor2?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        gradAngle?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Corners & Borders
        const radiusInput = document.getElementById('prop-border-radius');
        radiusInput?.addEventListener('input', (e) => {
            document.getElementById('radius-val').innerText = e.target.value;
            updateStyle('borderRadius', `${e.target.value}px`);
        });
        radiusInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        const borderWidth = document.getElementById('prop-border-width');
        const borderStyle = document.getElementById('prop-border-style');
        const borderColor = document.getElementById('prop-border-color');
        const borderColorHex = document.getElementById('prop-border-color-hex');

        borderWidth?.addEventListener('input', (e) => {
            updateStyle('borderWidth', `${e.target.value}px`);
        });
        borderWidth?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        borderStyle?.addEventListener('change', (e) => {
            updateStyle('borderStyle', e.target.value, true);
        });

        const updateBorderColor = () => {
            updateStyle('borderColor', borderColor.value);
        };
        borderColor?.addEventListener('input', (e) => {
            borderColorHex.value = e.target.value;
            updateBorderColor();
        });
        borderColor?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        borderColorHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                borderColor.value = e.target.value;
                updateBorderColor();
                window.canvasEditor.triggerHistorySave();
            }
        });

        // Box Shadows
        const shadowEnable = document.getElementById('prop-shadow-enable');
        const shadowGroup = document.getElementById('shadow-properties-container');
        
        shadowEnable?.addEventListener('change', (e) => {
            shadowGroup.classList.toggle('disabled-group', !e.target.checked);
            this.applyShadowStyle();
        });

        const shadowX = document.getElementById('prop-shadow-x');
        const shadowY = document.getElementById('prop-shadow-y');
        const shadowBlur = document.getElementById('prop-shadow-blur');
        const shadowSpread = document.getElementById('prop-shadow-spread');
        const shadowColor = document.getElementById('prop-shadow-color');
        const shadowInset = document.getElementById('prop-shadow-inset');

        const shadowInputs = [shadowX, shadowY, shadowBlur, shadowSpread, shadowColor, shadowInset];
        shadowInputs.forEach(input => {
            input?.addEventListener('input', () => this.applyShadowStyle());
            input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        });

        // Transforms
        const rotateInput = document.getElementById('prop-rotate');
        const scaleInput = document.getElementById('prop-scale');
        const skewInput = document.getElementById('prop-skew-x');

        const updateTransform = () => {
            document.getElementById('rotate-val').innerText = rotateInput.value;
            const t = `rotate(${rotateInput.value}deg) scale(${scaleInput.value}) skewX(${skewInput.value}deg)`;
            updateStyle('transform', t);
        };

        rotateInput?.addEventListener('input', updateTransform);
        rotateInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        scaleInput?.addEventListener('input', updateTransform);
        scaleInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        skewInput?.addEventListener('input', updateTransform);
        skewInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Filters
        const filterBlur = document.getElementById('prop-filter-blur');
        const filterBright = document.getElementById('prop-filter-brightness');
        
        const updateFilters = () => {
            const f = `blur(${filterBlur.value}px) brightness(${filterBright.value}%)`;
            updateStyle('filter', f);
        };
        
        filterBlur?.addEventListener('input', updateFilters);
        filterBlur?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        filterBright?.addEventListener('input', updateFilters);
        filterBright?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Backdrop Filter blur
        const bdBlur = document.getElementById('prop-backdrop-blur');
        bdBlur?.addEventListener('input', (e) => {
            const b = e.target.value > 0 ? `blur(${e.target.value}px)` : 'none';
            updateStyle('backdropFilter', b);
            updateStyle('webkitBackdropFilter', b);
        });
        bdBlur?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Artboard Background color
        const artboardBg = document.getElementById('prop-canvas-bg');
        const artboardBgHex = document.getElementById('prop-canvas-bg-hex');
        
        artboardBg?.addEventListener('input', (e) => {
            artboardBgHex.value = e.target.value;
            if (document.getElementById('paint-artboard')) document.getElementById('paint-artboard').style.backgroundColor = e.target.value;
        });
        artboardBg?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        artboardBgHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                artboardBg.value = e.target.value;
                if (document.getElementById('paint-artboard')) document.getElementById('paint-artboard').style.backgroundColor = e.target.value;
                window.canvasEditor.triggerHistorySave();
            }
        });

        // --- NEW 50+ PROPERTIES LISTENERS ---
        // Spacing
        ['mt', 'mb', 'ml', 'mr', 'pt', 'pb', 'pl', 'pr'].forEach(prop => {
            const map = { mt:'marginTop', mb:'marginBottom', ml:'marginLeft', mr:'marginRight', pt:'paddingTop', pb:'paddingBottom', pl:'paddingLeft', pr:'paddingRight' };
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                input?.addEventListener('input', (e) => updateStyle(map[prop], `${e.target.value}px`));
                input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
            }
        });

        // Layout & Flexbox
        const displayInput = document.getElementById('prop-display');
        if (displayInput) {
            displayInput?.addEventListener('change', (e) => {
                updateStyle('display', e.target.value, true);
                const flexControls = document.getElementById('flexbox-controls');
                if (flexControls) flexControls.classList.toggle('hidden', e.target.value !== 'flex' && e.target.value !== 'inline-flex');
            });
        }
        
        ['flex-direction', 'flex-wrap', 'justify-content', 'align-items'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if (input) input?.addEventListener('change', (e) => updateStyle(camel, e.target.value, true));
        });
        
        const gapInput = document.getElementById('prop-gap');
        if (gapInput) {
            gapInput?.addEventListener('input', (e) => updateStyle('gap', `${e.target.value}px`));
            gapInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        // Position
        const posInput = document.getElementById('prop-position');
        if(posInput) posInput?.addEventListener('change', (e) => updateStyle('position', e.target.value, true));

        ['top', 'bottom', 'left', 'right'].forEach(prop => {
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                input?.addEventListener('input', (e) => {
                    const val = e.target.value;
                    updateStyle(prop, val ? (isNaN(val) ? val : `${val}px`) : 'auto');
                });
                input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
            }
        });
        
        const zIndexInput = document.getElementById('prop-z-index');
        if(zIndexInput) {
            zIndexInput?.addEventListener('input', (e) => updateStyle('zIndex', e.target.value));
            zIndexInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        // Advanced CSS
        const opacityInput = document.getElementById('prop-opacity');
        if(opacityInput) {
            opacityInput?.addEventListener('input', (e) => updateStyle('opacity', e.target.value));
            opacityInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        ['mix-blend-mode', 'cursor', 'pointer-events', 'overflow'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) input?.addEventListener('change', (e) => updateStyle(camel, e.target.value, true));
        });

        // Text Effects
        ['letter-spacing', 'line-height'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                input?.addEventListener('input', (e) => updateStyle(camel, e.target.value));
                input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
            }
        });

        ['text-transform', 'text-decoration'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) input?.addEventListener('change', (e) => updateStyle(camel, e.target.value, true));
        });

        // Filters extended
        const filterContrast = document.getElementById('prop-filter-contrast');
        const filterSaturate = document.getElementById('prop-filter-saturate');
        const filterGrayscale = document.getElementById('prop-filter-grayscale');
        const filterHueRotate = document.getElementById('prop-filter-hue-rotate');
        
        const updateFiltersExtended = () => {
            const b = document.getElementById('prop-filter-blur')?.value || 0;
            const br = document.getElementById('prop-filter-brightness')?.value || 100;
            const c = filterContrast?.value || 100;
            const s = filterSaturate?.value || 100;
            const g = filterGrayscale?.value || 0;
            const h = filterHueRotate?.value || 0;
            
            const f = `blur(${b}px) brightness(${br}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) hue-rotate(${h}deg)`;
            updateStyle('filter', f);
        };

        if(filterContrast) { filterContrast?.addEventListener('input', updateFiltersExtended); filterContrast?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        if(filterSaturate) { filterSaturate?.addEventListener('input', updateFiltersExtended); filterSaturate?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        if(filterGrayscale) { filterGrayscale?.addEventListener('input', updateFiltersExtended); filterGrayscale?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        if(filterHueRotate) { filterHueRotate?.addEventListener('input', updateFiltersExtended); filterHueRotate?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        
        // Backdrop filter extended
        const bdBrightInput = document.getElementById('prop-backdrop-brightness');
        const updateBackdropExtended = () => {
            const bl = document.getElementById('prop-backdrop-blur')?.value || 0;
            const br = bdBrightInput?.value || 100;
            const b = (bl > 0 || br !== 100) ? `blur(${bl}px) brightness(${br}%)` : 'none';
            updateStyle('backdropFilter', b);
            updateStyle('webkitBackdropFilter', b);
        };
        if(bdBrightInput) {
            bdBrightInput?.addEventListener('input', updateBackdropExtended);
            bdBrightInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        // Transitions
        ['transition-property', 'transition-timing'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                if(prop==='transition-timing') input?.addEventListener('change', (e) => updateStyle('transitionTimingFunction', e.target.value, true));
                else input?.addEventListener('input', (e) => updateStyle('transitionProperty', e.target.value));
            }
        });
        const transDur = document.getElementById('prop-transition-duration');
        if(transDur) {
            transDur?.addEventListener('input', (e) => updateStyle('transitionDuration', `${e.target.value}s`));
            transDur?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

    }

    // Set up color swatch controls
    initSwatchListeners() {
        // Solid swatches click
        document.getElementById('swatches-solid')?.addEventListener('click', (e) => {
            const swatch = e.target.closest('.swatch-color');
            if (!swatch || !this.activeElement) return;
            
            const color = swatch.dataset.color;
            
            if (this.activeElement.classList.contains('text-element')) {
                // If text element selected, color controls the font color
                this.activeElement.style.color = color;
                if (document.getElementById('prop-text-color')) document.getElementById('prop-text-color').value = color;
                if (document.getElementById('prop-text-color-hex')) document.getElementById('prop-text-color-hex').value = color;
            } else {
                // Otherwise updates background color
                this.activeElement.style.background = color;
                this.activeElement.style.backgroundColor = color;
                if (document.getElementById('prop-bg-type')) document.getElementById('prop-bg-type').value = 'color';
                if (document.getElementById('prop-bg-color')) document.getElementById('prop-bg-color').value = color;
                if (document.getElementById('prop-bg-color-hex')) document.getElementById('prop-bg-color-hex').value = color;
                document.getElementById('bg-color-control')?.classList.remove('hidden');
                document.getElementById('bg-gradient-control')?.classList.add('hidden');
            }
            
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });

        // Gradient swatches click
        document.getElementById('swatches-gradient')?.addEventListener('click', (e) => {
            const swatch = e.target.closest('.swatch-gradient');
            if (!swatch || !this.activeElement) return;
            
            const grad = swatch.dataset.gradient;
            this.activeElement.style.background = grad;
            
            // Sync gradient inputs
            if (document.getElementById('prop-bg-type')) document.getElementById('prop-bg-type').value = 'gradient';
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.remove('hidden');
            
            // Parse details if matches
            const colorsMatch = grad.match(/#[0-9a-fA-F]{6}/g);
            if (colorsMatch && colorsMatch.length >= 2) {
                if (document.getElementById('prop-grad-color1')) document.getElementById('prop-grad-color1').value = colorsMatch[0];
                if (document.getElementById('prop-grad-color2')) document.getElementById('prop-grad-color2').value = colorsMatch[1];
            }
            
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });
    }

    // Set up Built-in Presets and Animation selectors
    initPresetListeners() {
        // Preset cards (Instant styles)
        document.getElementById('presets-panel')?.addEventListener('click', (e) => {
            const presetBtn = e.target.closest('.preset-card');
            if (!presetBtn || !this.activeElement) return;
            
            const preset = presetBtn.dataset.preset;
            
            // Clear existing presets
            this.activeElement.classList.forEach(className => {
                if (className.startsWith('preset-')) {
                    this.activeElement.classList.remove(className);
                }
            });
            
            // Reset base styles to not overlap preset importance
            this.activeElement.style.background = '';
            this.activeElement.style.boxShadow = '';
            this.activeElement.style.border = '';
            this.activeElement.style.backdropFilter = '';
            this.activeElement.style.webkitBackdropFilter = '';
            
            // Add class
            this.activeElement.classList.add(`preset-${preset}`);
            
            this.syncInspector(this.activeElement);
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });
        });

        // Advanced Custom CSS
        const btnApplyCss = document.getElementById('btn-apply-custom-css');
        const customCssInput = document.getElementById('prop-custom-css');
        if (btnApplyCss && customCssInput) {
            btnApplyCss.addEventListener('click', () => {
                if (!this.activeElement) return;
                const css = customCssInput.value;
                
                // Parse and apply without destroying left/top/width/height layout bounds
                const lines = css.split(';');
                lines.forEach(line => {
                    if (!line.includes(':')) return;
                    const [prop, val] = line.split(':');
                    if (prop && val) {
                        this.activeElement.style.setProperty(prop.trim(), val.trim());
                    }
                });
                
                window.canvasEditor.triggerHistorySave();
                this.syncInspector(this.activeElement);
                window.canvasEditor.updateSelectionBox();
            });
        }

        // Animation changes
        const animSelect = document.getElementById('prop-animation-type');
        const animDuration = document.getElementById('prop-anim-duration');
        const animInfinite = document.getElementById('prop-anim-infinite');

        const applyAnimation = () => {
            if (!this.activeElement) return;
            
            // 1. Remove existing anim- classes
            this.activeElement.classList.forEach(className => {
                if (className.startsWith('anim-')) {
                    this.activeElement.classList.remove(className);
                }
            });
            
            // 2. Set new animation
            const selected = animSelect.value;
            if (selected !== 'none') {
                this.activeElement.classList.add(`anim-${selected}`);
                
                // Add inline configuration variables
                this.activeElement.style.animationDuration = `${animDuration.value}s`;
                this.activeElement.style.animationIterationCount = animInfinite.checked ? 'infinite' : '1';
                
                // Reset styling properties that would conflict with text-rainbow
                if (selected === 'rainbow-text') {
                    this.activeElement.style.webkitTextFillColor = 'transparent';
                }
            } else {
                // Clear inline anim rules
                this.activeElement.style.animationName = '';
                this.activeElement.style.animationDuration = '';
                this.activeElement.style.animationIterationCount = '';
                
                // Clear visual effects & shadows for Flat Option
                this.activeElement.style.boxShadow = 'none';
                this.activeElement.style.backdropFilter = 'none';
                this.activeElement.style.webkitBackdropFilter = 'none';
                this.activeElement.style.textShadow = 'none';
                this.activeElement.style.filter = 'none';
            }
            
            window.canvasEditor.triggerHistorySave();
        };

        animSelect?.addEventListener('change', applyAnimation);
        animDuration?.addEventListener('input', applyAnimation);
        animDuration?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        animInfinite?.addEventListener('change', applyAnimation);
    }

    // Helper functions for style updates
    applyGradientStyle() {
        if (!this.activeElement) return;
        const angle = document.getElementById('prop-grad-angle')?.value;
        const color1 = document.getElementById('prop-grad-color1')?.value;
        const color2 = document.getElementById('prop-grad-color2')?.value;
        const type = document.getElementById('prop-grad-type')?.value;
        
        let gradVal = '';
        if (type === 'linear') {
            gradVal = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
        } else {
            gradVal = `radial-gradient(circle, ${color1} 0%, ${color2} 100%)`;
        }
        
        this.activeElement.style.background = gradVal;
        window.canvasEditor.updateSelectionBox();
    }

    applyShadowStyle() {
        if (!this.activeElement) return;
        const enable = document.getElementById('prop-shadow-enable')?.checked;
        
        if (!enable) {
            this.activeElement.style.boxShadow = 'none';
            return;
        }
        
        const x = document.getElementById('prop-shadow-x')?.value;
        const y = document.getElementById('prop-shadow-y')?.value;
        const blur = document.getElementById('prop-shadow-blur')?.value;
        const spread = document.getElementById('prop-shadow-spread')?.value;
        const color = document.getElementById('prop-shadow-color')?.value;
        const inset = document.getElementById('prop-shadow-inset')?.checked ? 'inset' : '';
        
        const shadowVal = `${inset} ${x}px ${y}px ${blur}px ${spread}px ${color}`.trim();
        this.activeElement.style.boxShadow = shadowVal;
    }

    // Generate Layers Panel List dynamically
    updateLayersList() {
        const container = document.getElementById('layers-container');
        container.innerHTML = '';
        
        const elements = Array.from(document.getElementById('paint-artboard').querySelectorAll('.canvas-element'));
        
        if (elements.length === 0) {
            container.innerHTML = '<li class="empty-layers">No layers added yet</li>';
            return;
        }
        
        // Reverse elements array to display top-most elements first (z-index natural order)
        elements.reverse().forEach(el => {
            const isText = el.classList.contains('text-element');
            const icon = isText ? 'type' : 'shapes';
            const name = el.dataset.name || 'Element';
            const isActive = this.activeElement === el;
            
            const isLocked = el.style.pointerEvents === 'none';
            const isHidden = el.style.display === 'none';
            
            const li = document.createElement('li');
            li.className = `layer-item ${isActive ? 'active' : ''}`;
            li.innerHTML = `
                <div class="layer-info">
                    <i data-lucide="${icon}"></i>
                    <span>${name}</span>
                </div>
                <div class="layer-actions">
                    <button class="layer-action-btn toggle-lock" title="Lock element editing">
                        <i data-lucide="${isLocked ? 'lock' : 'unlock'}"></i>
                    </button>
                    <button class="layer-action-btn toggle-vis" title="Toggle visibility">
                        <i data-lucide="${isHidden ? 'eye-off' : 'eye'}"></i>
                    </button>
                    <button class="layer-action-btn delete" title="Delete element">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            
            // Layer Item Click Selection
            li?.addEventListener('mousedown', (e) => {
                if (e.target.closest('.layer-action-btn')) return; // ignore action buttons
                window.canvasEditor.selectElement(el);
            });
            
            // Lock Toggling
            li.querySelector('.toggle-lock').addEventListener('click', (e) => {
                e.stopPropagation();
                const locked = el.style.pointerEvents === 'none';
                el.style.pointerEvents = locked ? 'auto' : 'none';
                
                // Clear selection if locking selected element
                if (!locked && this.activeElement === el) {
                    window.canvasEditor.deselectAll();
                }
                this.updateLayersList();
            });
            
            // Visibility Toggling
            li.querySelector('.toggle-vis').addEventListener('click', (e) => {
                e.stopPropagation();
                const hidden = el.style.display === 'none';
                el.style.display = hidden ? '' : 'none';
                
                // Clear selection if hiding selected element
                if (!hidden && this.activeElement === el) {
                    window.canvasEditor.deselectAll();
                }
                this.updateLayersList();
            });
            
            // Deleting Layer
            li.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.activeElement === el) {
                    window.canvasEditor.deselectAll();
                }
                el.remove();
                window.canvasEditor.triggerHistorySave();
                window.canvasEditor.updateElementsCount();
                this.updateLayersList();
            });
            
            container.appendChild(li);
        });
        
        lucide.createIcons(); // Render layer action icons
    }

    // Color conversion utility helper functions
    rgbToHex(rgbStr) {
        if (!rgbStr) return "#ffffff";
        if (rgbStr.startsWith('#')) return rgbStr;
        
        const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
        if (!match) return "#ffffff";
        
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    }

    hexToRgba(hex, alpha = 1) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
        }
        return hex;
    }
}

// Export singleton instance
window.controlsManager = new ControlsManager();


/* --- js/export.js --- */
/* DesignCraft Export Utility
   Compiles elements on the canvas into clean, class-based, standard-compliant 
   HTML and CSS. Creates separated and combined components, copy functions, 
   and handles ZIP archive generations. */

class ExportService {
    constructor() {
        this.btnExport = document.getElementById('btn-export');
        this.modalExport = document.getElementById('modal-export');
        this.modalExportClose = document.getElementById('modal-export-close');
        
        this.codeCombined = document.getElementById('code-combined-out');
        this.codeHtml = document.getElementById('code-html-out');
        this.codeCss = document.getElementById('code-css-out');
        
        this.initEvents();
    }

    initEvents() {
        this.btnExport?.addEventListener('click', () => this.openExportModal());
        this.modalExportClose?.addEventListener('click', () => this.modalExport.classList.add('hidden'));
        
        // Tab navigators in Modal
        this.modalExport.querySelectorAll('.modal-tab').forEach(btn => {
            btn?.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.modalTab;
                
                this.modalExport.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.modalExport.querySelectorAll('.modal-tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === targetTab);
                });
            });
        });

        // Copy buttons
        document.getElementById('btn-copy-combined')?.addEventListener('click', () => this.copyToClipboard(this.codeCombined, "Combined code"));
        document.getElementById('btn-copy-html')?.addEventListener('click', () => this.copyToClipboard(this.codeHtml, "HTML structure"));
        document.getElementById('btn-copy-css')?.addEventListener('click', () => this.copyToClipboard(this.codeCss, "CSS stylesheet"));
        
        // Downloads
        document.getElementById('btn-download-html')?.addEventListener('click', () => this.downloadSingleHtml());
        document.getElementById('btn-download-project')?.addEventListener('click', () => this.downloadZipArchive());
    }

    openExportModal() {
        this.modalExport.classList.remove('hidden');
        this.compileProject();
    }

    compileProject() {
        const artboard = document.getElementById('paint-artboard');
        const elements = artboard.querySelectorAll('.canvas-element');
        
        if (elements.length === 0) {
            this.codeCombined.innerText = "<!-- Artboard is empty. Add elements to export code. -->";
            this.codeHtml.innerText = "<!-- Artboard is empty -->";
            this.codeCss.innerText = "/* Artboard is empty */";
            return;
        }

        let cssRules = [];
        let htmlElements = [];

        // Add base container style
        const artboardBg = artboard.style.backgroundColor || "#121216";
        cssRules.push(`.artboard-container {\n  position: relative;\n  width: ${artboard.style.width};\n  height: ${artboard.style.height};\n  background-color: ${artboardBg};\n  overflow: hidden;\n  border-radius: 8px;\n  box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n}`);

        // Add pre-built animations styling from canvas.css if elements use them
        let includedAnimations = new Set();
        
        elements.forEach((el, index) => {
            const elId = el.id || `el-${index}`;
            const className = `dc-${elId}`;
            
            // Clone node to clean up structural metadata attributes
            const clone = el.cloneNode(true);
            clone.removeAttribute('id');
            clone.removeAttribute('data-selected');
            
            // Handle element class conversions
            clone.className = clone.className.replace('canvas-element', '').trim();
            clone.classList.add(className);
            
            // Clean up custom variables and fetch animations used
            clone.classList.forEach(cls => {
                if (cls.startsWith('anim-')) {
                    includedAnimations.add(cls.replace('anim-', ''));
                }
            });

            // Extract inline styles to class rule
            const inlineStyles = el.style.cssText;
            if (inlineStyles) {
                // Remove pointer-events from export so elements are clickable/normal
                let cleanStyles = inlineStyles.replace(/pointer-events:\s*[^;]+;?/g, '').trim();
                cssRules.push(`.${className} {\n  ${cleanStyles.split(';').map(s => s.trim()).filter(Boolean).join(';\n  ')};\n}`);
            }

            // Remove inline style from HTML
            clone.removeAttribute('style');
            
            // Format HTML representation
            htmlElements.push(clone.outerHTML);
        });

        // Pull dynamic AI generated stylesheet declarations
        const dynamicStyleEl = document.getElementById('dynamic-ai-styles');
        let dynamicCss = dynamicStyleEl ? dynamicStyleEl.innerText.trim() : '';

        // Load keyframes for animations used
        let keyframesCss = '';
        if (includedAnimations.size > 0) {
            keyframesCss = `/* ANIMATION KEYFRAMES & UTILITIES */\n`;
            if (includedAnimations.has('pulse')) {
                keyframesCss += `@keyframes animation-pulse {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.05); }\n}\n.anim-pulse {\n  animation: animation-pulse 2s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('float')) {
                keyframesCss += `@keyframes animation-float {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-15px); }\n}\n.anim-float {\n  animation: animation-float 3s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('spin')) {
                keyframesCss += `@keyframes animation-spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}\n.anim-spin {\n  animation: animation-spin 6s linear infinite;\n}\n\n`;
            }
            if (includedAnimations.has('neon-glow')) {
                keyframesCss += `@keyframes animation-neon-glow {\n  0%, 100% { box-shadow: 0 0 5px rgba(99,102,241,0.4); }\n  50% { box-shadow: 0 0 20px rgba(99,102,241,0.8), 0 0 35px rgba(99,102,241,0.5); }\n}\n.anim-neon-glow {\n  animation: animation-neon-glow 2.5s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('jelly')) {
                keyframesCss += `@keyframes animation-jelly {\n  0%, 100% { transform: scale(1, 1); }\n  25% { transform: scale(0.9, 1.1); }\n  50% { transform: scale(1.1, 0.9); }\n}\n.anim-jelly {\n  animation: animation-jelly 1.5s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('bounce')) {
                keyframesCss += `@keyframes animation-bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-25%); }\n}\n.anim-bounce {\n  animation: animation-bounce 1s infinite;\n}\n\n`;
            }
            if (includedAnimations.has('rainbow-text')) {
                keyframesCss += `@keyframes animation-rainbow-bg {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}\n.anim-rainbow-text {\n  background: linear-gradient(to right, #ff007f, #7f00ff, #00f0ff, #7f00ff, #ff007f);\n  background-size: 200% auto;\n  color: transparent !important;\n  -webkit-background-clip: text !important;\n  background-clip: text !important;\n  animation: animation-rainbow-bg 4s linear infinite;\n}\n\n`;
            }
        }

        // Add CSS preset rules if used (e.g. preset-glass-light)
        let presetCss = '';
        const htmlStr = htmlElements.join('\n');
        if (htmlStr.includes('preset-glass-light')) {
            presetCss += `.preset-glass-light {\n  background: rgba(255, 255, 255, 0.4) !important;\n  backdrop-filter: blur(12px) saturate(180%) !important;\n  border: 1px solid rgba(255, 255, 255, 0.45) !important;\n  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08) !important;\n}\n`;
        }
        if (htmlStr.includes('preset-glass-dark')) {
            presetCss += `.preset-glass-dark {\n  background: rgba(15, 15, 20, 0.6) !important;\n  backdrop-filter: blur(16px) saturate(160%) !important;\n  border: 1px solid rgba(255, 255, 255, 0.08) !important;\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;\n}\n`;
        }
        if (htmlStr.includes('preset-neumorphic-light')) {
            presetCss += `.preset-neumorphic-light {\n  background: #e0e0e0 !important;\n  box-shadow: 9px 9px 16px #bebebe, -9px -9px 16px #ffffff !important;\n  border-radius: 20px;\n}\n`;
        }
        if (htmlStr.includes('preset-neumorphic-dark')) {
            presetCss += `.preset-neumorphic-dark {\n  background: #1e1e24 !important;\n  box-shadow: 6px 6px 12px #0f0f12, -6px -6px 12px #2d2d36 !important;\n  border-radius: 20px;\n}\n`;
        }
        if (htmlStr.includes('preset-cyberpunk')) {
            presetCss += `.preset-cyberpunk {\n  background: #000000 !important;\n  border: 2px solid #00f0ff !important;\n  box-shadow: 0 0 10px #00f0ff, inset 0 0 10px #00f0ff, 0 0 20px #ff007f !important;\n  color: #00f0ff !important;\n  font-family: 'Courier New', monospace !important;\n  text-shadow: 0 0 5px #00f0ff !important;\n}\n`;
        }
        if (htmlStr.includes('preset-aurora')) {
            presetCss += `.preset-aurora {\n  background: linear-gradient(135deg, #ff007f 0%, #7f00ff 50%, #00f0ff 100%) !important;\n  box-shadow: 0 0 30px rgba(127, 0, 255, 0.5) !important;\n  color: #ffffff !important;\n}\n`;
        }
        if (htmlStr.includes('preset-retro')) {
            presetCss += `.preset-retro {\n  background: #f8f9fa !important;\n  border: 4px solid #212529 !important;\n  box-shadow: 4px 4px 0px #212529 !important;\n  border-radius: 0px !important;\n}\n`;
        }

        // Format Complete CSS
        const fullCss = `/* DesignCraft Generated Stylesheet */\n\n${cssRules.join('\n\n')}\n\n${presetCss}${dynamicCss ? '\n/* AI Injected Styles */\n' + dynamicCss + '\n' : ''}\n${keyframesCss}`.trim();
        this.codeCss.innerText = fullCss;

        // Format HTML structure
        const indentHtml = htmlElements.map(el => `  ${el}`).join('\n');
        const fullHtml = `<div class="artboard-container">\n${indentHtml}\n</div>`;
        this.codeHtml.innerText = fullHtml;

        // Combined Template Output
        const combined = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesignCraft CSS Component</title>
  <!-- Outfit & Inter Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0b0b0d;
      font-family: 'Inter', sans-serif;
    }
    
    ${fullCss.replace(/\n/g, '\n    ')}
  </style>
</head>
<body>

  ${fullHtml.replace(/\n/g, '\n  ')}

</body>
</html>`;
        this.codeCombined.innerText = combined;
    }

    copyToClipboard(element, label) {
        const text = element.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert(`${label} successfully copied to clipboard!`);
        });
    }

    downloadSingleHtml() {
        const blob = new Blob([this.codeCombined.innerText], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${window.firebaseService.activeProjectName || 'designcraft-component'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async downloadZipArchive() {
        const zipName = window.firebaseService.activeProjectName || 'designcraft-project';
        const zip = new JSZip();
        
        // 1. Create clean index.html template linked to style.css
        const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${zipName} - DesignCraft</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body style="margin: 0; padding: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #0b0b0d; font-family: 'Inter', sans-serif;">

  ${this.codeHtml.innerText.replace(/\n/g, '\n  ')}

  <script>
    // Initialize icons if any
    lucide.createIcons();
  </script>
</body>
</html>`;

        // 2. Generate zip contents
        zip.file("index.html", cleanHtml);
        zip.file("style.css", this.codeCss.innerText);
        
        // 3. Compress and download
        this.showSpinnerOnZipButton(true);
        try {
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${zipName}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("ZIP Generation failed", err);
            alert("Failed to build ZIP file. Please copy the code blocks instead.");
        } finally {
            this.showSpinnerOnZipButton(false);
        }
    }

    showSpinnerOnZipButton(isLoading) {
        const btn = document.getElementById('btn-download-project');
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:14px; height:14px; border-width:1.5px; margin:0 auto;"></div> Compressing...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="archive"></i> Download Complete Project (.zip)';
            lucide.createIcons();
        }
    }
}

// Export singleton instance
window.exportService = new ExportService();


/* --- js/ai.js --- */
/* DesignCraft AI Assistant
   Governs the dynamic AI Design System. Runs a dual pipeline:
   1. OpenRouter (Llama 3.3) for prompt refinement & token extraction.
   2. Google Gemini API for HTML/CSS generation under strict HSL, 
      Typography, and Design Trend constraints.
   Features a mathematical WCAG Contrast Guard. */

class AIService {
    constructor() {
        this.btnGenerate = document.getElementById('btn-generate-ai');
        this.promptTextarea = document.getElementById('ai-prompt');
        this.openRouterKeyInput = document.getElementById('api-key');
        this.geminiKeyInput = document.getElementById('gemini-key');
        this.modelSelect = document.getElementById('ai-model');
        this.statusBox = document.getElementById('ai-status');
        this.statusText = document.getElementById('ai-status-text');
        this.codePreview = document.getElementById('generated-css-code');
        this.btnCopyCode = document.getElementById('btn-copy-generated');
        
        this.dynamicStylesheet = document.getElementById('dynamic-ai-styles');
        if (!this.dynamicStylesheet) {
            this.dynamicStylesheet = document.createElement('style');
            this.dynamicStylesheet.id = 'dynamic-ai-styles';
            document.head.appendChild(this.dynamicStylesheet);
        }

        this.initEvents();
    }

    initEvents() {
        this.btnGenerate?.addEventListener('click', () => this.runDualAIPipeline());
        this.btnCopyCode?.addEventListener('click', () => this.copyGeneratedCode());

        // Sidebar Code Preview Tab Selectors
        const tabCss = document.getElementById('tab-selector-css');
        const tabHtml = document.getElementById('tab-selector-html');
        const preCss = document.getElementById('pre-generated-css');
        const preHtml = document.getElementById('pre-generated-html');

        if (tabCss && tabHtml && preCss && preHtml) {
            tabCss?.addEventListener('click', () => {
                tabCss.classList.add('active');
                tabCss.style.borderBottomColor = 'var(--accent-color)';
                tabCss.style.color = 'var(--text-primary)';
                
                tabHtml.classList.remove('active');
                tabHtml.style.borderBottomColor = 'transparent';
                tabHtml.style.color = 'var(--text-muted)';
                
                preCss.classList.remove('hidden');
                preHtml.classList.add('hidden');
                this.activeCodeTab = 'css';
            });

            tabHtml?.addEventListener('click', () => {
                tabHtml.classList.add('active');
                tabHtml.style.borderBottomColor = 'var(--accent-color)';
                tabHtml.style.color = 'var(--text-primary)';
                
                tabCss.classList.remove('active');
                tabCss.style.borderBottomColor = 'transparent';
                tabCss.style.color = 'var(--text-muted)';
                
                preHtml.classList.remove('hidden');
                preCss.classList.add('hidden');
                this.activeCodeTab = 'html';
            });
        }

        // Creation Mode Buttons click toggler
        document.querySelectorAll('.creation-mode-btn')?.forEach(btn => {
            btn?.addEventListener('click', (e) => {
                document.querySelectorAll('.creation-mode-btn')?.forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                const artboard = document.getElementById('paint-artboard');
                if (artboard) {
                    if (btn.dataset.mode === 'landing') {
                        artboard.classList.add('mode-landing-active');
                    } else {
                        artboard.classList.remove('mode-landing-active');
                    }
                }
            });
        });

        this.activeCodeTab = 'css';
    }

    // DUAL AI PIPELINE COORDINATOR
    async runDualAIPipeline() {
        // Enforce Authentication check before AI generation
        const firebaseService = window.firebaseService;
        if (firebaseService) {
            // If Firebase is connected (not localMode), user must be signed in
            if (!firebaseService.localMode) {
                // If auth hasn't resolved yet, wait briefly
                if (!firebaseService.authReady) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                // Now check if user is signed in
                if (!firebaseService.user) {
                    if (firebaseService.modalAuth) {
                        firebaseService.modalAuth.classList.remove('hidden');
                        if (typeof firebaseService.resetAuthForm === 'function') {
                            firebaseService.resetAuthForm();
                        }
                    }
                    this.showStatus("Please Sign In to use the AI Designer.", false);
                    return;
                }
            }
            // If localMode = true, allow free use without sign-in
        }

        const prompt = this.promptTextarea.value.trim();
        const orKey = this.openRouterKeyInput.value.trim();
        const orModel = this.modelSelect.value || 'meta-llama/llama-3.3-70b-instruct:free';

        if (!prompt) { this.showStatus('Please type a design command first!', false); return; }

        // ── Security Checks ──
        const sec = window.securityEngine;
        if (sec) {
            const isAuth = !!(window.firebaseService?.user);
            const check = sec.runFullCheck(prompt, isAuth);
            if (!check.ok) {
                this.showStatus(`🛡️ ${check.reason}`, false);
                return;
            }
            const { used, limit } = check.quotaCheck;
            this.showStatus(`Security OK · ${used + 1}/${limit} uses today`, true);
        }

        // Always use OpenRouter (server-side keys) — Gemini keys removed
        const refinerMode = 'openrouter';

        const modeBtn = document.querySelector('.creation-mode-btn.active');
        const generationMode = modeBtn ? modeBtn.dataset.mode : 'landing';
        
        const animationsCheckbox = document.getElementById('ai-enable-animations');
        const animationsEnabled = animationsCheckbox ? animationsCheckbox.checked : true;

        // 1. Create and show skeleton shimmer card loader
        this.removeShimmer();
        this.shimmerEl = document.createElement('div');
        this.shimmerEl.className = 'skeleton-shimmer';
        this.shimmerEl.style.left = '150px';
        this.shimmerEl.style.top = '100px';
        this.shimmerEl.innerHTML = `
            <div class="shimmer-line header"></div>
            <div class="shimmer-line"></div>
            <div class="shimmer-line short"></div>
            <div class="shimmer-btn"></div>
        `;
        document.getElementById('paint-artboard')?.appendChild(this.shimmerEl);

        try {
            // Check for Lock Style state
            let styleLockContext = null;
            const activeEl = window.canvasEditor?.selectedElement;
            const lockCheckbox = document.getElementById('ai-lock-style');
            if (lockCheckbox && lockCheckbox.checked && activeEl) {
                const hueVal = activeEl.style.getPropertyValue('--hue') || 240;
                const bgLVal = activeEl.style.getPropertyValue('--bg-l') ? parseFloat(activeEl.style.getPropertyValue('--bg-l')) : 8;
                const textLVal = activeEl.style.getPropertyValue('--text-l') ? parseFloat(activeEl.style.getPropertyValue('--text-l')) : 95;
                
                let trendVal = 'minimal-dark';
                if (activeEl.classList.contains('preset-glassmorphism')) trendVal = 'glassmorphism';
                else if (activeEl.classList.contains('preset-cyberpunk')) trendVal = 'cyberpunk';
                else if (activeEl.classList.contains('preset-neo-brutalism')) trendVal = 'neo-brutalism';
                
                let animVal = 'none';
                activeEl.classList.forEach(cls => {
                    if (cls.startsWith('anim-')) animVal = cls.substring(5);
                });
                
                styleLockContext = {
                    designTrend: trendVal,
                    hue: parseInt(hueVal),
                    bgL: bgLVal,
                    textL: textLVal,
                    animation: animVal
                };
            }

            // STEP 1: Prompt Refinement (Gemini / OpenRouter fallback)
            let designTokens = null;
            if (refinerMode === 'openrouter') {
                this.showStatus("Refining design tokens (OpenRouter)...", true);
                designTokens = await this.refinePromptWithOpenRouter(prompt, orKey, orModel, styleLockContext, generationMode, animationsEnabled);
            } else {
                this.showStatus("Refining design tokens (Gemini)...", true);
                designTokens = await this.refinePromptWithGemini(prompt, geminiKey, styleLockContext, generationMode, animationsEnabled);
            }
            console.log("Extracted Design Tokens:", designTokens);

            // Update shimmer accent outline based on computed tokens
            if (this.shimmerEl) {
                this.shimmerEl.style.setProperty('--accent-color', `hsl(${designTokens.hue}, 90%, 60%)`);
                this.shimmerEl.style.boxShadow = `0 0 20px hsl(${designTokens.hue}, 90%, 60%, 0.35)`;
            }

            // STEP 2: UI Generation via Gemini 2.5
            this.showStatus(`Synthesizing ${designTokens.designTrend} layout...`, true);
            const component = await this.generateComponentWithGemini(designTokens, geminiKey, generationMode, animationsEnabled);
            
            // STEP 3: Apply Constraints, WCAG Contrast Guard, and Paint
            if (component.mode === 'full-site') {
                this.removeShimmer();
                this.showFullSitePreview(component.html);
            } else {
                this.showStatus("Running Contrast Guard...", true);
                this.injectAndVerifyComponent(component, designTokens);
            }

        } catch (err) {
            console.error('Pipeline failure:', err);
            this.removeShimmer();

            // Show the REAL error to the user - no silent fallback
            const msg = err.message || 'Unknown error';
            this.showStatus(`❌ AI Error: ${msg}`, false);
            setTimeout(() => this.statusBox?.classList.add('hidden'), 6000);
        }
    }

    removeShimmer() {
        if (this.shimmerEl && this.shimmerEl.parentNode) {
            this.shimmerEl.remove();
        }
        this.shimmerEl = null;
    }

    // Step 1: OpenRouter Prompt Refiner
    async refinePromptWithOpenRouter(userPrompt, apiKey, model, styleLockContext = null, generationMode = 'landing', animationsEnabled = true) {
        const designDbString = JSON.stringify(window.FIGMA_DESIGN_DATABASE || {}, null, 2);
        
        let lockInstruction = "";
        if (styleLockContext) {
            lockInstruction = `
CRITICAL DIRECTIVE: The user has LOCKED the design style. You MUST copy the following parameters EXACTLY as they are into your JSON output:
- "designTrend": "${styleLockContext.designTrend}"
- "hue": ${styleLockContext.hue}
- "bgL": ${styleLockContext.bgL}
- "textL": ${styleLockContext.textL}
- "animation": "${styleLockContext.animation}"
Do NOT change these parameters. Only write a new refinedBlueprint describing the layout structure and texts matching the new prompt.`;
        }

        let modeInstruction = "";
        if (generationMode === 'asset') {
            modeInstruction = `\nFORCE ASSET CREATION: The user wants to build a single standalone UI element/component (Asset). You MUST outline a compact blueprint describing a single self-contained card, badge, shape, list, or panel. Do NOT outline a landing page navigation header, footer, or multiple sections!`;
        } else {
            modeInstruction = `\nFORCE LANDING PAGE CREATION: The user wants to build a full multi-section landing page. You MUST outline a multi-section layout containing header, hero body, features bento, stats row, and footer.`;
        }

        const systemPrompt = `You are a prompt engineer and design token extractor.
Your job is to decode a user's description into structural design parameters (tokens).
Select one of these 4 design trends based on the prompt's mood:
- glassmorphism (frosted, translucent, blurred background)
- minimal-dark (clean, charcoal background, high space, thin border)
- cyberpunk (black, neon glowing borders, monospace elements)
- neo-brutalism (flat bright colors, thick borders, hard offset black shadows)
${modeInstruction}

Landing Page Scaling Directive:
- If the user prompt asks for a "landing page", "dashboard", "full site", "homepage", or "multi-section page", you MUST generate a "refinedBlueprint" that structures a complete multi-section layout containing:
  1. A navigation header (Logo, nav links, CTA button).
  2. A Hero Section (large headline, description, primary/secondary buttons).
  3. A Features Bento Grid (2x2 or 3-column grid showing card details).
  4. A Stats/Statistics bar (large numbers, light labels).
  5. A Footer (copyright, social links).

Tone & Emotional Theming Adaptation Rules:
- Study, notes, reading, cozy, warm -> Choose "minimal-dark", but force light pastel colors: hue (20-60 or 200-220), bgL (92 to 96), textL (10 to 15) for comfortable reading.
- Hacking, gaming, crypto, terminal -> Choose "cyberpunk", force bgL to 0 (pure black), high-contrast glow, monospace typography.
- Business, finance, portfolio -> Choose "minimal-dark" or "glassmorphism", choose professional blue/indigo hues (220-250), bgL (6 to 12).

Reference the Figma Design System Rules:
${designDbString}
${lockInstruction}

Output ONLY a raw JSON string in this schema:
{
  "designTrend": "glassmorphism" | "minimal-dark" | "cyberpunk" | "neo-brutalism",
  "hue": 240, // Accent hue selection (0 to 360)
  "bgL": 8, // Background lightness (0 to 100)
  "textL": 95, // Text lightness (0 to 100)
  "animation": "glow" | "pulse" | "float" | "jelly" | "bounce" | "slide",
  "refinedBlueprint": "a detailed architectural layout outline based on the prompt."
}
No Markdown wrappers (no \`\`\`json). No explanation.`;

        const fetchUrl = apiKey ? 'https://openrouter.ai/api/v1/chat/completions' : '/api/openrouter';
        const fetchHeaders = { 'Content-Type': 'application/json' };
        if (apiKey) {
            fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
            fetchHeaders['HTTP-Referer'] = window.location.origin;
            fetchHeaders['X-Title'] = 'DesignCraft CSS';
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Decode: ${userPrompt}` }
        ];

        // Server-side: send {uid, messages} — backend extracts and uses its key pool
        const bodyPayload = apiKey
            ? { model, messages, temperature: 0.2 }
            : { uid: window.firebaseService?.user?.uid || null, messages, max_tokens: 1024 };

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const d = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter Error: ${d?.error?.message || response.status}`);
        }

        const data = await response.json();
        let reply = (data.choices?.[0]?.message?.content || '').trim();
        if (reply.startsWith('```')) reply = reply.replace(/```json|```/g, '').trim();
        const jm = reply.match(/\{[\s\S]*\}/);
        if (!jm) throw new Error(`Bad JSON from AI: ${reply.slice(0, 100)}`);
        return JSON.parse(jm[0]);
    }

    // Step 1b: Gemini-based Prompt Refiner (Fallback/Direct)
    async refinePromptWithGemini(userPrompt, apiKey, styleLockContext = null, generationMode = 'landing', animationsEnabled = true) {
        const designDbString = JSON.stringify(window.FIGMA_DESIGN_DATABASE || {}, null, 2);
        
        let lockInstruction = "";
        if (styleLockContext) {
            lockInstruction = `
CRITICAL DIRECTIVE: The user has LOCKED the design style. You MUST copy the following parameters EXACTLY as they are into your JSON output:
- "designTrend": "${styleLockContext.designTrend}"
- "hue": ${styleLockContext.hue}
- "bgL": ${styleLockContext.bgL}
- "textL": ${styleLockContext.textL}
- "animation": "${styleLockContext.animation}"
Do NOT change these parameters. Only write a new refinedBlueprint describing the layout structure and texts matching the new prompt.`;
        }

        let modeInstruction = "";
        if (generationMode === 'asset') {
            modeInstruction = `\nFORCE ASSET CREATION: The user wants to build a single standalone UI element/component (Asset). You MUST outline a compact blueprint describing a single self-contained card, badge, shape, list, or panel. Do NOT outline a landing page navigation header, footer, or multiple sections!`;
        } else {
            modeInstruction = `\nFORCE LANDING PAGE CREATION: The user wants to build a full multi-section landing page. You MUST outline a multi-section layout containing header, hero body, features bento, stats row, and footer.`;
        }

        const systemPrompt = `You are a prompt engineer and design token extractor.
Your job is to decode a user's description into structural design parameters (tokens).
Select one of these 4 design trends based on the prompt's mood:
- glassmorphism (frosted, translucent, blurred background)
- minimal-dark (clean, charcoal background, high space, thin border)
- cyberpunk (black, neon glowing borders, monospace elements)
- neo-brutalism (flat bright colors, thick borders, hard offset black shadows)
${modeInstruction}

Landing Page Scaling Directive:
- If the user prompt asks for a "landing page", "dashboard", "full site", "homepage", or "multi-section page", you MUST generate a "refinedBlueprint" that structures a complete multi-section layout containing:
  1. A navigation header (Logo, nav links, CTA button).
  2. A Hero Section (large headline, description, primary/secondary buttons).
  3. A Features Bento Grid (2x2 or 3-column grid showing card details).
  4. A Stats/Statistics bar (large numbers, light labels).
  5. A Footer (copyright, social links).

Tone & Emotional Theming Adaptation Rules:
- Study, notes, reading, cozy, warm -> Choose "minimal-dark", but force light pastel colors: hue (20-60 or 200-220), bgL (92 to 96), textL (10 to 15) for comfortable reading.
- Hacking, gaming, crypto, terminal -> Choose "cyberpunk", force bgL to 0 (pure black), high-contrast glow, monospace typography.
- Business, finance, portfolio -> Choose "minimal-dark" or "glassmorphism", choose professional blue/indigo hues (220-250), bgL (6 to 12).

Reference the Figma Design System Rules:
${designDbString}
${lockInstruction}

Output ONLY a raw JSON string in this schema:
{
  "designTrend": "glassmorphism" | "minimal-dark" | "cyberpunk" | "neo-brutalism",
  "hue": 240, // Accent hue selection (0 to 360)
  "bgL": 8, // Background lightness (0 to 100)
  "textL": 95, // Text lightness (0 to 100)
  "animation": "glow" | "pulse" | "float" | "jelly" | "bounce" | "slide",
  "refinedBlueprint": "a detailed architectural layout outline based on the prompt."
}
No Explanation. Output ONLY valid JSON.`;

        const fetchUrl = apiKey 
            ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
            : `/api/gemini`;
            
        const bodyPayload = {
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nDecode: ${userPrompt}`
                }]
            }]
            // Note: NO responseMimeType - it causes failures on many Gemini versions
        };

        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(apiKey ? bodyPayload : { uid: window.firebaseService?.user?.uid, payload: bodyPayload })
        });

        if (!response.ok) {
            if (response.status === 429) {
                const data = await response.json();
                throw new Error(data?.error?.message || "Free limit exhausted. Please enter your own API key.");
            }
            const data = await response.json();
            throw new Error(`Gemini Refiner Error: ${data?.error?.message || response.status}`);
        }

        const data = await response.json();
        let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        // Bullet-proof JSON extraction: strip markdown, find first {...}
        if (reply.startsWith('```')) reply = reply.replace(/```json|```/g, '').trim();
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error(`Gemini returned non-JSON: ${reply.slice(0, 120)}`);
        return JSON.parse(jsonMatch[0]);
    }

    // Step 2: Gemini Code Generator
    async generateComponentWithGemini(tokens, apiKey, generationMode = 'landing', animationsEnabled = true) {
        const figmaRules = window.FIGMA_DESIGN_DATABASE?.trends?.[tokens.designTrend] || {};

        let animationDirective = "";
        if (!animationsEnabled) {
            animationDirective = `CRITICAL: NO hover states (:hover), NO transitions, NO @keyframes, NO animations. Strictly static flat CSS only.`;
        } else {
            animationDirective = `Interactive animations, hover states, transitions, and micro-animations are all PERMITTED and encouraged.`;
        }

        // ── LANDING PAGE MODE: full standalone HTML file ──
        if (generationMode === 'landing') {
            const systemPrompt = `You are a world-class senior frontend engineer and UI/UX designer.
Your task: Generate a COMPLETE, standalone, production-ready HTML webpage — NOT a component, NOT a div — a full website.

RULES:
1. Output a single COMPLETE HTML document starting with <!DOCTYPE html> and ending with </html>.
2. Include <head> with: charset, viewport, title, Google Fonts import, and ALL CSS inside a <style> tag.
3. Include a <body> with full multi-section page: Navbar, Hero, Features/Bento Grid, Stats, Testimonials (optional), CTA, Footer.
4. Use ONLY inline <style> and vanilla JavaScript. No external CDN dependencies except Google Fonts.
5. NO placeholder images — use CSS shapes, SVG icons, gradient blocks, and HTML art instead.
6. ${animationDirective}
7. Design System:
   - Design Trend: ${tokens.designTrend}
   - Primary Hue: ${tokens.hue}deg (use hsl())
   - Background Lightness: ${tokens.bgL}%
   - Text Lightness: ${tokens.textL}%
   - Use CSS variables: --hue, --accent, --bg, --text on :root
8. Use modern CSS: grid, flexbox, clamp(), CSS variables, backdrop-filter.
9. Make it look like a $10,000 premium agency website — stunning, editorial, award-winning.
10. The HTML must be complete and render perfectly when opened in any browser.

Layout blueprint to implement:
${tokens.refinedBlueprint}

Output ONLY the raw complete HTML. No markdown, no explanation, no code fences.`;

            // Route to OpenRouter server-side (4-key pool, free models)
            const orUrl = '/api/openrouter';
            const orMessages = [{ role: 'user', content: systemPrompt }];
            const orBody = { uid: window.firebaseService?.user?.uid || null, messages: orMessages, max_tokens: 8192 };
            const response = await fetch(orUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orBody) });
            if (!response.ok) {
                const d = await response.json().catch(() => ({}));
                throw new Error(`AI Error: ${d?.error?.message || response.status}`);
            }
            const data = await response.json();
            let html = (data.choices?.[0]?.message?.content || '').trim();
            if (html.startsWith('```')) html = html.replace(/```html|```/g, '').trim();
            if (window.securityEngine) html = window.securityEngine.sanitizeOutput(html);
            if (window.securityEngine) window.securityEngine.incrementDailyUsage();
            return { mode: 'full-site', html };
        }

        const systemPrompt = `You are a master UI/UX software architect.
Generate HTML and CSS for a component using the design system configuration provided.

${animationDirective}

105 DESIGN UTILITY TOOLS AND CLASSES (YOUR AI TOOLBOX):
You MUST use these pre-defined variables, utility classes, and custom rules inside your HTML and CSS:

A. HSL Color Space & Variables (15 Tools):
   Use these CSS variables on the root/parent element. Do NOT use hex (#fff) or rgb.
   - --hue: ${tokens.hue};
   - --bg-h: ${tokens.hue};
   - --bg-s: 15%;
   - --bg-l: ${tokens.bgL}%;
   - --bg-color: hsl(var(--bg-h), var(--bg-s), var(--bg-l));
   - --text-h: ${tokens.hue};
   - --text-s: 10%;
   - --text-l: ${tokens.textL}%;
   - --text-color: hsl(var(--text-h), var(--text-s), var(--text-l));
   - --accent-h: ${tokens.hue};
   - --accent-s: 90%;
   - --accent-l: 60%;
   - --accent-color: hsl(var(--accent-h), var(--accent-s), var(--accent-l));
   - --secondary-h: ${tokens.hue}; --secondary-s: 70%; --secondary-l: 50%; --secondary-color: hsl(var(--secondary-h), var(--secondary-s), var(--secondary-l));

B. Typography & Weights (14 Tools):
   - Font family options: 'Outfit', 'Satoshi', 'Inter', sans-serif (or monospace for cyberpunk).
   - FontSize Utility Classes: .text-xs (11px), .text-sm (13px), .text-md (15px), .text-lg (18px), .text-xl (22px), .text-2xl (28px), .text-3xl (36px), .text-4xl (48px), .text-5xl (64px).
   - FontWeight Classes: .font-light (300), .font-normal (400), .font-semibold (600), .font-bold (700), .font-black (900).

C. Visual Shadows, Speculars & Corners (18 Tools):
   - Brutalist offsets: .shadow-brutal-1 (2px), .shadow-brutal-2 (4px), .shadow-brutal-3 (6px), .shadow-brutal-4 (8px), .shadow-brutal-5 (10px) - all offset-x/y with solid black (#000) and 0 blur.
   - Neumorphic curves: .shadow-neu-embossed (soft highlights/lowlights), .shadow-neu-debossed (sunken).
   - Glow overlays: .shadow-glow-cyan (0 0 12px rgba(0,240,255,0.4)), .shadow-glow-magenta, .shadow-glow-purple, .shadow-glow-green.
   - Corners: .rounded-none (0px), .rounded-sm (4px), .rounded-md (8px), .rounded-lg (12px), .rounded-xl (16px), .rounded-xxl (24px), .rounded-full (999px).
   - Border styles: .border-thick-black (3px solid #000), .border-thin-glass (1px solid rgba(255,255,255,0.1)).

D. Backdrop Filters (8 Tools):
   - Blurs: .blur-none (0), .blur-sm (4px), .blur-md (8px), .blur-lg (12px), .blur-xl (18px), .blur-xxl (28px).
   - Saturate multipliers: .saturate-100, .saturate-150, .saturate-200.

E. Interactive States & Animations (22 Tools):
   - Interactive shifts: .hover-scale (scales 1.03 on hover), .hover-up (translateY(-3px)).
   - Active focus: .focus-glow-indigo, .focus-glow-neon.
   - Custom styled narrow dark scrollbars.
   - Hardware accelerated animations: .anim-pulse (scale heartbeat), .anim-float (vertical hover float), .anim-spin (infinite rotate), .anim-jelly (scale squash/bounce on hover), .anim-slide (reveal sliding transition), .anim-neon-flicker (cyber neon flicker effect), .anim-rainbow-text, .anim-scanline (sliding scanlines overlay), .anim-waterfall.

F. Procedural Patterns & Layout Grids (28 Tools):
   - Patterns: .bg-pattern-grid, .bg-pattern-dots, .bg-pattern-stripes, .bg-pattern-aurora, .bg-pattern-hex, .bg-pattern-waves, .bg-pattern-starfield.
   - Layout templates: .grid-bento-3x3, .grid-bento-2x2, .flex-split-hero, .grid-split-2col, .navbar-glass-sticky, .navbar-minimal, .card-widget-small, .card-widget-wide, .pricing-tier-container, .features-comparison-list, .testimonials-masonry.

Output ONLY a raw JSON string in this exact format:
{
  "html": "<div class=\\"canvas-element custom-component\\"> ... </div>",
  "css": ".custom-component { ... } \\n .custom-component h1 { ... }"
}
Do not write anything else.
Asset dimensions: width 320-400px, height auto. Compact, self-contained.`;

        // Route asset generation to OpenRouter
        const orMessages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Build this layout component: ${tokens.refinedBlueprint}` }
        ];
        const orBody = { uid: window.firebaseService?.user?.uid || null, messages: orMessages, max_tokens: 4096 };
        const response = await fetch('/api/openrouter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orBody)
        });

        if (!response.ok) {
            const d = await response.json().catch(() => ({}));
            throw new Error(`AI Error: ${d?.error?.message || response.status}`);
        }

        const data = await response.json();
        let reply = (data.choices?.[0]?.message?.content || '').trim();
        if (reply.startsWith('```')) reply = reply.replace(/```json|```/g, '').trim();
        const jm = reply.match(/\{[\s\S]*\}/);
        if (!jm) throw new Error(`AI returned non-JSON: ${reply.slice(0, 100)}`);
        return JSON.parse(jm[0]);
    }

    // Step 3: Inject, calculate Contrast Guards, and display
    injectAndVerifyComponent(component, tokens) {
        // Remove shimmer placeholder
        this.removeShimmer();

        // Parse component
        const parser = new DOMParser();
        const doc = parser.parseFromString(component.html, 'text/html');
        const newEl = doc.body.firstChild;

        if (!newEl || !newEl.classList.contains('canvas-element')) {
            throw new Error("Returned HTML must root in a canvas-element div.");
        }

        // Apply Design System HSL overrides
        newEl.style.setProperty('--hue', tokens.hue);
        newEl.style.setProperty('--bg-h', tokens.hue);
        newEl.style.setProperty('--bg-s', '15%');
        newEl.style.setProperty('--bg-l', `${tokens.bgL}%`);
        
        newEl.style.setProperty('--text-h', tokens.hue);
        newEl.style.setProperty('--text-s', '10%');
        newEl.style.setProperty('--text-l', `${tokens.textL}%`);

        // CONTRAST GUARD SYSTEM
        const contrastRatio = this.calculateContrast(tokens.hue, 15, tokens.bgL, tokens.hue, 10, tokens.textL);
        console.log(`Computed Contrast Ratio: ${contrastRatio.toFixed(2)}:1`);

        if (contrastRatio < 4.5) {
            console.warn(`Contrast ratio ${contrastRatio.toFixed(2)} is too low (WCAG standard is 4.5+). Auto-adjusting Text Lightness...`);
            // Adjust text lightness depending on background lightness
            const adjustedTextL = tokens.bgL < 50 ? 95 : 8; // Light text for dark bg, dark text for light bg
            newEl.style.setProperty('--text-l', `${adjustedTextL}%`);
            console.log(`Contrast Guard override: --text-l adjusted to ${adjustedTextL}%`);
        }

        // Apply Position coordinates (dynamically centered on the artboard)
        newEl.id = `ai-${Date.now()}`;
        const artboardEl = document.getElementById('paint-artboard');
        const abW = artboardEl ? artboardEl.clientWidth : 1000;
        const abH = artboardEl ? artboardEl.clientHeight : 650;
        newEl.style.left = `${Math.max(40, (abW - 350) / 2)}px`;
        newEl.style.top = `${Math.max(40, (abH - 300) / 2)}px`;
        newEl.style.zIndex = window.canvasEditor.getMaxZIndex() + 1;
        
        // Add layout trend classes if needed
        newEl.classList.add(`preset-${tokens.designTrend}`);
        if (tokens.animation !== 'none') {
            newEl.classList.add(`anim-${tokens.animation}`);
        }

        let className = '';
        newEl.classList.forEach(cls => {
            if (cls !== 'canvas-element' && cls !== 'text-element' && !cls.startsWith('preset-') && !cls.startsWith('anim-')) {
                className = cls;
            }
        });
        newEl.dataset.name = `AI ${className ? (className.charAt(0).toUpperCase() + className.slice(1)) : 'Card'}`;

        // Inject styles
        this.dynamicStylesheet.appendChild(document.createTextNode("\n" + component.css));
        this.codePreview.innerText = component.css;
        const htmlCodeContainer = document.getElementById('generated-html-code');
        if (htmlCodeContainer) {
            htmlCodeContainer.innerText = component.html;
        }

        // Add to canvas
        const artboard = document.getElementById('paint-artboard');
        artboard.appendChild(newEl);

        lucide.createIcons();
        window.canvasEditor.selectElement(newEl);
        window.canvasEditor.triggerHistorySave();
        window.canvasEditor.updateElementsCount();
        
        if (window.controlsManager) {
            window.controlsManager.updateLayersList();
        }

        // Play high-end UI success pop chime
        if (window.playUISound) {
            window.playUISound('success');
        }

        this.showStatus("✅ Element generated & validated!", false);
        setTimeout(() => this.statusBox.classList.add('hidden'), 3000);
    }

    // Full Site Preview — renders complete HTML in a fullscreen iframe overlay
    showFullSitePreview(fullHtml) {
        // Remove existing preview if any
        const existing = document.getElementById('full-site-preview-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'full-site-preview-overlay';
        overlay.innerHTML = `
            <div class="fsp-toolbar">
                <div class="fsp-toolbar-left">
                    <span class="fsp-badge">🌐 Live Site Preview</span>
                    <span class="fsp-info">Full HTML • AI Generated</span>
                </div>
                <div class="fsp-toolbar-right">
                    <button class="fsp-btn" id="fsp-download">⬇ Download HTML</button>
                    <button class="fsp-btn" id="fsp-copy">📋 Copy Code</button>
                    <button class="fsp-btn fsp-close" id="fsp-close">✕ Close Preview</button>
                </div>
            </div>
            <iframe id="fsp-iframe" sandbox="allow-scripts allow-same-origin allow-forms" frameborder="0"></iframe>
        `;
        document.body.appendChild(overlay);

        // Write full HTML into iframe (blob URL — safe, no XSS)
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        if (document.getElementById('fsp-iframe')) document.getElementById('fsp-iframe').src = blobUrl;

        // Store code for copy/download
        overlay._fullHtml = fullHtml;

        // Close
        const fspClose = document.getElementById('fsp-close');
        if (fspClose) fspClose.onclick = () => {
            URL.revokeObjectURL(blobUrl);
            overlay.remove();
        };

        // Download
        const fspDownload = document.getElementById('fsp-download');
        if (fspDownload) fspDownload.onclick = () => {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `designcraft-site-${Date.now()}.html`;
            a.click();
        };

        // Copy
        const fspCopy = document.getElementById('fsp-copy');
        if (fspCopy) fspCopy.onclick = () => {
            navigator.clipboard.writeText(fullHtml).then(() => {
                const el = document.getElementById('fsp-copy');
                if (el) el.textContent = '✅ Copied!';
                setTimeout(() => {
                    const el2 = document.getElementById('fsp-copy');
                    if (el2) el2.textContent = '📋 Copy Code';
                }, 2000);
            });
        };

        // Also store in code panel
        const htmlContainer = document.getElementById('generated-html-code');
        if (htmlContainer) htmlContainer.innerText = fullHtml;

        this.showStatus('✅ Full site generated!', false);
        setTimeout(() => this.statusBox.classList.add('hidden'), 3000);
    }

    // WCAG CONTRAST RATIO MATH
    calculateContrast(h1, s1, l1, h2, s2, l2) {
        const rgb1 = this.hslToRgb(h1, s1, l1);
        const rgb2 = this.hslToRgb(h2, s2, l2);

        const lum1 = this.getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = this.getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);

        const brighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        return (brighter + 0.05) / (darker + 0.05);
    }

    getRelativeLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    showStatus(msg, isSpinner = true) {
        this.statusText.innerText = msg;
        this.statusBox.querySelector('.spinner').style.display = isSpinner ? 'block' : 'none';
        this.statusBox.classList.remove('hidden');
    }

    copyGeneratedCode() {
        const isCss = this.activeCodeTab === 'css';
        const codeElement = isCss ? this.codePreview : document.getElementById('generated-html-code');
        const code = codeElement ? codeElement.innerText : '';
        
        if (!code || code.startsWith('/*') || code.startsWith('<!--')) return;
        
        navigator.clipboard.writeText(code).then(() => {
            alert(`AI-generated ${isCss ? 'CSS' : 'HTML'} copied to clipboard!`);
        });
    }
}

// Export singleton instance
window.aiService = new AIService();


/* --- js/presets_data.js --- */
/* DesignCraft 50+ Stunning Style Presets Database
   Contains 54 premium presets categorized into 6 design systems.
   Applies HSL variables, baseline classes, and specific box-shadow / border rules. */

const PRESETS_DATABASE = {
    glass: [
        { id: "glass-frost-l", name: "Frosted Light", style: "glassmorphism", vars: { hue: 210, bgL: 95, textL: 12 }, css: { background: "rgba(255, 255, 255, 0.3)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" } },
        { id: "glass-frost-d", name: "Obsidian Frost", style: "glassmorphism", vars: { hue: 240, bgL: 6, textL: 95 }, css: { background: "rgba(10, 10, 15, 0.45)", backdropFilter: "blur(18px)", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" } },
        { id: "glass-cobalt", name: "Cobalt Plate", style: "glassmorphism", vars: { hue: 220, bgL: 12, textL: 96 }, css: { background: "rgba(30, 41, 59, 0.5)", backdropFilter: "blur(14px)", border: "1px solid rgba(99, 102, 241, 0.25)", boxShadow: "0 8px 32px rgba(30,41,59,0.3)" } },
        { id: "glass-emerald", name: "Emerald Glare", style: "glassmorphism", vars: { hue: 150, bgL: 8, textL: 94 }, css: { background: "rgba(6, 78, 59, 0.35)", backdropFilter: "blur(15px)", border: "1px solid rgba(16, 185, 129, 0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } },
        { id: "glass-sunset", name: "Sunset Aura", style: "glassmorphism", vars: { hue: 18, bgL: 9, textL: 97 }, css: { background: "rgba(124, 45, 18, 0.3)", backdropFilter: "blur(16px)", border: "1px solid rgba(251, 146, 60, 0.3)", boxShadow: "0 10px 30px rgba(251,146,60,0.1)" } },
        { id: "glass-golden", name: "Royal Amber", style: "glassmorphism", vars: { hue: 45, bgL: 8, textL: 95 }, css: { background: "rgba(251, 191, 36, 0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(251, 191, 36, 0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" } },
        { id: "glass-matrix", name: "Matrix Veil", style: "glassmorphism", vars: { hue: 120, bgL: 4, textL: 95 }, css: { background: "rgba(0, 20, 0, 0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(0, 255, 0, 0.2)", boxShadow: "0 8px 24px rgba(0,255,0,0.1)" } },
        { id: "glass-neon-p", name: "Cyber Blossom", style: "glassmorphism", vars: { hue: 320, bgL: 6, textL: 97 }, css: { background: "rgba(255, 0, 128, 0.08)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 0, 128, 0.3)", boxShadow: "0 8px 32px rgba(255,0,128,0.15)" } },
        { id: "glass-deep", name: "Vortex Blur", style: "glassmorphism", vars: { hue: 260, bgL: 5, textL: 95 }, css: { background: "rgba(20, 10, 35, 0.5)", backdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 15px 50px rgba(0,0,0,0.5)" } }
    ],
    neumorphic: [
        { id: "neu-light-emb", name: "Soft Embossed", style: "neumorphic-light", vars: { hue: 210, bgL: 93, textL: 15 }, css: { background: "#edf2f7", border: "none", boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" } },
        { id: "neu-light-deb", name: "Soft Debossed", style: "neumorphic-light", vars: { hue: 210, bgL: 93, textL: 15 }, css: { background: "#edf2f7", border: "none", boxShadow: "inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff" } },
        { id: "neu-dark-emb", name: "Dark Embossed", style: "neumorphic-dark", vars: { hue: 230, bgL: 10, textL: 92 }, css: { background: "#1a1a24", border: "none", boxShadow: "6px 6px 12px #0c0c11, -6px -6px 12px #282837" } },
        { id: "neu-dark-deb", name: "Dark Debossed", style: "neumorphic-dark", vars: { hue: 230, bgL: 10, textL: 92 }, css: { background: "#1a1a24", border: "none", boxShadow: "inset 6px 6px 12px #0c0c11, inset -6px -6px 12px #282837" } },
        { id: "neu-clay-b", name: "Clay Blue", style: "neumorphic-light", vars: { hue: 210, bgL: 85, textL: 12 }, css: { background: "#c3dafe", border: "none", borderRadius: "24px", boxShadow: "8px 8px 16px #a5bdf0, -8px -8px 16px #e1f7ff, inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(0,0,0,0.1)" } },
        { id: "neu-clay-p", name: "Clay Peach", style: "neumorphic-light", vars: { hue: 20, bgL: 90, textL: 15 }, css: { background: "#fed7d7", border: "none", borderRadius: "24px", boxShadow: "8px 8px 16px #d9b5b5, -8px -8px 16px #ffffff, inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(0,0,0,0.08)" } },
        { id: "neu-steel", name: "Sleek Steel", style: "neumorphic-dark", vars: { hue: 220, bgL: 14, textL: 94 }, css: { background: "linear-gradient(145deg, #252532, #1f1f2a)", border: "none", boxShadow: "5px 5px 15px #0f0f15, -5px -5px 15px #2f2f3f" } },
        { id: "neu-cushion", name: "Cushion Pill", style: "neumorphic-light", vars: { hue: 240, bgL: 96, textL: 12 }, css: { background: "#f8fafc", border: "none", borderRadius: "30px", boxShadow: "8px 8px 20px #e2e8f0, -8px -8px 20px #ffffff" } },
        { id: "neu-velvet", name: "Royal Velvet", style: "neumorphic-dark", vars: { hue: 280, bgL: 8, textL: 93 }, css: { background: "#160f20", border: "none", boxShadow: "6px 6px 12px #0a070e, -6px -6px 12px #221732" } }
    ],
    cyber: [
        { id: "cyb-cyan", name: "Neon Cyan Grid", style: "cyberpunk", vars: { hue: 180, bgL: 0, textL: 100 }, css: { background: "#000000", border: "2px solid #00f0ff", boxShadow: "0 0 15px rgba(0,240,255,0.4), inset 0 0 8px rgba(0,240,255,0.2)" } },
        { id: "cyb-matrix", name: "Green Code", style: "cyberpunk", vars: { hue: 120, bgL: 0, textL: 95 }, css: { background: "#000000", border: "2px solid #39ff14", fontFamily: "'Fira Code', monospace", boxShadow: "0 0 12px rgba(57,255,20,0.4)" } },
        { id: "cyb-tokyo", name: "Tokyo Neon", style: "cyberpunk", vars: { hue: 320, bgL: 2, textL: 98 }, css: { background: "#050008", border: "2px solid #ff00f0", boxShadow: "0 0 15px rgba(255,0,240,0.5), 0 0 5px #00f0ff" } },
        { id: "cyb-toxic", name: "Radioactive Lime", style: "cyberpunk", vars: { hue: 85, bgL: 1, textL: 96 }, css: { background: "#020400", border: "2px solid #adff2f", boxShadow: "0 0 14px rgba(173,255,47,0.45)" } },
        { id: "cyb-mars", name: "Deep Space Red", style: "cyberpunk", vars: { hue: 0, bgL: 0, textL: 95 }, css: { background: "#000000", border: "2px solid #ef4444", boxShadow: "0 0 15px rgba(239,68,68,0.5), inset 0 0 6px rgba(239,68,68,0.2)" } },
        { id: "cyb-hud", name: "Retro Amber HUD", style: "cyberpunk", vars: { hue: 35, bgL: 3, textL: 95 }, css: { background: "#0a0600", border: "2px solid #f59e0b", fontFamily: "'Fira Code', monospace", boxShadow: "0 0 10px rgba(245,158,11,0.4)" } },
        { id: "cyb-quantum", name: "Quantum Blue", style: "cyberpunk", vars: { hue: 200, bgL: 0, textL: 97 }, css: { background: "#000005", border: "2px solid #3b82f6", boxShadow: "0 0 20px rgba(59,130,246,0.6)" } },
        { id: "cyb-voltage", name: "Volt Lavender", style: "cyberpunk", vars: { hue: 270, bgL: 2, textL: 98 }, css: { background: "#040108", border: "2px solid #8b5cf6", boxShadow: "0 0 14px rgba(139,92,246,0.5), inset 0 0 10px rgba(139,92,246,0.2)" } },
        { id: "cyb-sun", name: "Solar Flare", style: "cyberpunk", vars: { hue: 22, bgL: 0, textL: 95 }, css: { background: "#000000", border: "2px solid #f97316", boxShadow: "0 0 16px rgba(249,115,22,0.5)" } }
    ],
    minimal: [
        { id: "min-charcoal", name: "Slate Charcoal", style: "minimal-dark", vars: { hue: 220, bgL: 6, textL: 95 }, css: { background: "#0b0b0d", border: "1px solid #1e1e24", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" } },
        { id: "min-obsidian", name: "Deep Obsidian", style: "minimal-dark", vars: { hue: 240, bgL: 3, textL: 97 }, css: { background: "#050507", border: "1px solid #131317", borderRadius: "16px" } },
        { id: "min-jet", name: "Void Black", style: "minimal-dark", vars: { hue: 0, bgL: 0, textL: 98 }, css: { background: "#000000", border: "1px solid #111111", borderRadius: "8px" } },
        { id: "min-ash", name: "Cool Ash", style: "minimal-dark", vars: { hue: 210, bgL: 12, textL: 94 }, css: { background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" } },
        { id: "min-sand", name: "Warm Sand Light", style: "minimal-dark", vars: { hue: 35, bgL: 94, textL: 12 }, css: { background: "#fdfbf7", border: "1px solid #e7e2d8", borderRadius: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" } },
        { id: "min-white", name: "Matte White", style: "minimal-dark", vars: { hue: 240, bgL: 98, textL: 10 }, css: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 8px 24px rgba(148,163,184,0.08)" } },
        { id: "min-space", name: "Silent Space", style: "minimal-dark", vars: { hue: 230, bgL: 8, textL: 95 }, css: { background: "#111827", border: "1px solid #1f2937", borderRadius: "20px" } },
        { id: "min-alpine", name: "Alpine Grey", style: "minimal-dark", vars: { hue: 200, bgL: 90, textL: 15 }, css: { background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "12px" } },
        { id: "min-steel", name: "Industrial Steel", style: "minimal-dark", vars: { hue: 210, bgL: 15, textL: 96 }, css: { background: "#1e293b", border: "1px solid #475569", borderRadius: "6px" } }
    ],
    aura: [
        { id: "aur-nebula", name: "Cosmic Nebula", style: "minimal-dark", vars: { hue: 275, bgL: 8, textL: 97 }, css: { background: "radial-gradient(circle at 0% 0%, rgba(139,92,246,0.3) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.3) 0%, transparent 50%), #0d0d11", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" } },
        { id: "aur-twilight", name: "Twilight Glow", style: "minimal-dark", vars: { hue: 290, bgL: 9, textL: 96 }, css: { background: "radial-gradient(circle at 10% 20%, rgba(124,58,237,0.2) 0%, transparent 70%), radial-gradient(circle at 90% 80%, rgba(79,70,229,0.25) 0%, transparent 60%), #09090e", border: "1px solid rgba(139,92,246,0.2)" } },
        { id: "aur-bubblegum", name: "Bubblegum Sky", style: "minimal-dark", vars: { hue: 330, bgL: 10, textL: 98 }, css: { background: "radial-gradient(circle at 100% 0%, rgba(244,114,182,0.25) 0%, transparent 70%), radial-gradient(circle at 0% 100%, rgba(96,165,250,0.25) 0%, transparent 70%), #0f0f15" } },
        { id: "aur-eclipse", name: "Solar Eclipse", style: "minimal-dark", vars: { hue: 20, bgL: 6, textL: 95 }, css: { background: "radial-gradient(circle at 50% -20%, rgba(249,115,22,0.25) 0%, transparent 80%), #07070a", border: "1px solid rgba(249,115,22,0.15)" } },
        { id: "aur-emerald", name: "Emerald Ray", style: "minimal-dark", vars: { hue: 155, bgL: 7, textL: 94 }, css: { background: "radial-gradient(circle at 80% 20%, rgba(52,211,153,0.2) 0%, transparent 60%), #050806", border: "1px solid rgba(52,211,153,0.12)" } },
        { id: "aur-ocean", name: "Neon Ocean", style: "minimal-dark", vars: { hue: 195, bgL: 8, textL: 96 }, css: { background: "radial-gradient(circle at 0% 100%, rgba(6,182,212,0.22) 0%, transparent 60%), radial-gradient(circle at 100% 0%, rgba(59,130,246,0.22) 0%, transparent 60%), #0b0f19" } },
        { id: "aur-lavender", name: "Electric Mint", style: "minimal-dark", vars: { hue: 250, bgL: 9, textL: 97 }, css: { background: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.22) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.22) 0%, transparent 50%), #0d0d12" } },
        { id: "aur-infrared", name: "Infrared Ray", style: "minimal-dark", vars: { hue: 350, bgL: 7, textL: 95 }, css: { background: "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.18) 0%, transparent 70%), #090505" } },
        { id: "aur-horizon", name: "Golden Horizon", style: "minimal-dark", vars: { hue: 40, bgL: 9, textL: 96 }, css: { background: "radial-gradient(circle at 50% 120%, rgba(245,158,11,0.25) 0%, transparent 70%), #0f0d0a" } }
    ],
    brutalist: [
        { id: "brut-yellow", name: "Brutal Comic", style: "neo-brutalism", vars: { hue: 45, bgL: 68, textL: 5 }, css: { backgroundColor: "#fef08a", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-purple", name: "Toxic Comic", style: "neo-brutalism", vars: { hue: 280, bgL: 65, textL: 5 }, css: { backgroundColor: "#d8b4fe", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-orange", name: "Tangerine", style: "neo-brutalism", vars: { hue: 24, bgL: 60, textL: 5 }, css: { backgroundColor: "#fdba74", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-pink", name: "Punk Rock", style: "neo-brutalism", vars: { hue: 330, bgL: 65, textL: 5 }, css: { backgroundColor: "#fbcfe8", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-blue", name: "Heavy Contrast", style: "neo-brutalism", vars: { hue: 200, bgL: 55, textL: 100 }, css: { backgroundColor: "#3b82f6", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-retro", name: "Gameboy Green", style: "neo-brutalism", vars: { hue: 90, bgL: 45, textL: 5 }, css: { backgroundColor: "#8bab1c", border: "3px solid #000000", borderRadius: "4px", boxShadow: "4px 4px 0px #000000" } },
        { id: "brut-newspaper", name: "Cream Paper", style: "neo-brutalism", vars: { hue: 40, bgL: 92, textL: 8 }, css: { backgroundColor: "#fafaf6", border: "3px solid #000000", borderRadius: "0px", boxShadow: "5px 5px 0px #000000" } },
        { id: "brut-bauhaus", name: "Bauhaus Red", style: "neo-brutalism", vars: { hue: 0, bgL: 50, textL: 100 }, css: { backgroundColor: "#dc2626", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-aqua", name: "Cyan Pop", style: "neo-brutalism", vars: { hue: 180, bgL: 60, textL: 5 }, css: { backgroundColor: "#67e8f9", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const presetTabs = document.getElementById('preset-category-tabs');
    const presetsGrid = document.getElementById('presets-dynamic-grid');

    if (!presetTabs || !presetsGrid) return;

    // Render presets of a specific category
    function renderPresets(category) {
        presetsGrid.innerHTML = '';
        const list = PRESETS_DATABASE[category] || [];

        list.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'preset-card';
            btn.dataset.presetId = p.id;
            btn.title = p.name;

            // Generate a style preview string for the mini swatch
            let styleStr = '';
            for (const [k, v] of Object.entries(p.css)) {
                // Convert camelCase style to kebab-case
                const kebabKey = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                styleStr += `${kebabKey}: ${v}; `;
            }

            // Create circular swatch preview
            btn.innerHTML = `
                <div class="preview-swatch" style="${styleStr} border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; overflow: hidden; height: 32px; width: 100%; border: 1px solid var(--panel-border);"></div>
                <span style="font-size: 9px; font-weight: 500; margin-top: 4px; display: block; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%; text-align: center;">${p.name}</span>
            `;

            btn?.addEventListener('click', () => {
                applyPresetToSelection(p);
            });

            presetsGrid.appendChild(btn);
        });
    }

    // Apply selected preset tokens to current canvas element
    function applyPresetToSelection(preset) {
        const el = window.canvasEditor?.selectedElement;
        if (!el) {
            alert("Select an element on the canvas first to apply this preset style!");
            return;
        }

        // 1. Remove all old trend preset classes
        el.classList.remove('preset-glassmorphism', 'preset-minimal-dark', 'preset-cyberpunk', 'preset-neo-brutalism');
        
        // 2. Add new preset trend class
        el.classList.add(`preset-${preset.style}`);

        // 3. Reset standard inline background / border style overrides
        el.style.background = '';
        el.style.backgroundColor = '';
        el.style.border = '';
        el.style.boxShadow = '';
        el.style.backdropFilter = '';
        el.style.borderRadius = '';
        el.style.fontFamily = '';

        // 4. Inject specific preset styles
        for (const [k, v] of Object.entries(preset.css)) {
            el.style[k] = v;
        }

        // 5. Inject HSL Variable overrides
        el.style.setProperty('--hue', preset.vars.hue);
        el.style.setProperty('--bg-h', preset.vars.hue);
        el.style.setProperty('--bg-s', '15%');
        el.style.setProperty('--bg-l', `${preset.vars.bgL}%`);
        
        el.style.setProperty('--text-h', preset.vars.hue);
        el.style.setProperty('--text-s', '10%');
        el.style.setProperty('--text-l', `${preset.vars.textL}%`);

        el.style.setProperty('--accent-h', preset.vars.hue);
        el.style.setProperty('--accent-s', '90%');
        el.style.setProperty('--accent-l', '60%');

        // Sync inspector panel controls
        if (window.controlsManager) {
            window.controlsManager.syncActiveElementToInspector();
        }

        window.canvasEditor.updateSelectionBox();
        window.canvasEditor.triggerHistorySave();
    }

    // Tab clicks event delegation
    presetTabs?.addEventListener('click', (e) => {
        const tab = e.target.closest('.preset-cat-btn');
        if (!tab) return;

        // Clear active classes
        presetTabs.querySelectorAll('.preset-cat-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set active
        tab.classList.add('active');

        // Render presets
        const cat = tab.dataset.cat;
        renderPresets(cat);
    });

    // Render default Glass category on start
    renderPresets('glass');
});


/* --- js/core/initTools.js --- */
import ToolManager from './toolManager.js';

// The 100+ Tool Registry
const toolsRegistry = [
    // 1. Selection & Isolation Tools
    { id: 'tool_move', name: 'Move Tool', icon: 'mouse-pointer-2', path: 'selection/moveTool.js', shortcut: 'V', group: 'selection' },
    { id: 'tool_direct_select', name: 'Direct Selection', icon: 'mouse-pointer', path: 'selection/directSelectTool.js', shortcut: 'A', group: 'selection' },
    { id: 'tool_marquee_rect', name: 'Marquee (Rect)', icon: 'square-dashed', path: 'selection/marqueeRectTool.js', shortcut: 'M', group: 'selection' },
    { id: 'tool_marquee_ellipse', name: 'Marquee (Ellipse)', icon: 'circle-dashed', path: 'selection/marqueeEllipseTool.js', shortcut: 'Shift+M', group: 'selection' },
    { id: 'tool_lasso', name: 'Lasso Tool', icon: 'lasso', path: 'selection/lassoTool.js', shortcut: 'L', group: 'selection' },
    { id: 'tool_lasso_poly', name: 'Polygonal Lasso', icon: 'lasso-select', path: 'selection/lassoPolyTool.js', group: 'selection' },
    { id: 'tool_lasso_magnetic', name: 'Magnetic Lasso', icon: 'magnet', path: 'selection/lassoMagneticTool.js', group: 'selection' },
    { id: 'tool_magic_wand', name: 'Magic Wand', icon: 'wand-2', path: 'selection/magicWandTool.js', shortcut: 'W', group: 'selection' },
    { id: 'tool_quick_select', name: 'Quick Selection', icon: 'brush', path: 'selection/quickSelectTool.js', group: 'selection' },
    { id: 'tool_object_select', name: 'Object Selection (AI)', icon: 'scan-line', path: 'selection/objectSelectTool.js', group: 'selection' },
    { id: 'tool_color_range', name: 'Color Range', icon: 'pipette', path: 'selection/colorRangeTool.js', group: 'selection' },

    // 2. Drawing & Painting
    { id: 'tool_brush', name: 'Brush Tool', icon: 'paintbrush', path: 'drawing/brushTool.js', shortcut: 'B', group: 'drawing' },
    { id: 'tool_pencil', name: 'Pencil Tool', icon: 'pencil', path: 'drawing/pencilTool.js', shortcut: 'N', group: 'drawing' },
    { id: 'tool_mixer_brush', name: 'Mixer Brush', icon: 'paint-bucket', path: 'drawing/mixerBrushTool.js', group: 'drawing' },
    { id: 'tool_airbrush', name: 'Airbrush', icon: 'spray-can', path: 'drawing/airbrushTool.js', group: 'drawing' },
    { id: 'tool_pixel_art', name: 'Pixel Art Brush', icon: 'grid', path: 'drawing/pixelArtTool.js', group: 'drawing' },
    { id: 'tool_calligraphy', name: 'Calligraphy Pen', icon: 'pen-tool', path: 'drawing/calligraphyTool.js', group: 'drawing' },
    { id: 'tool_marker', name: 'Marker Tool', icon: 'highlighter', path: 'drawing/markerTool.js', group: 'drawing' },
    { id: 'tool_spray', name: 'Spray Paint', icon: 'spray-can', path: 'drawing/sprayTool.js', group: 'drawing' },
    { id: 'tool_eraser', name: 'Eraser', icon: 'eraser', path: 'drawing/eraserTool.js', shortcut: 'E', group: 'drawing' },
    { id: 'tool_bg_eraser', name: 'Background Eraser', icon: 'image-minus', path: 'drawing/bgEraserTool.js', group: 'drawing' },
    { id: 'tool_magic_eraser', name: 'Magic Eraser', icon: 'sparkles', path: 'drawing/magicEraserTool.js', group: 'drawing' },
    { id: 'tool_paint_bucket', name: 'Paint Bucket', icon: 'paint-bucket', path: 'drawing/paintBucketTool.js', shortcut: 'G', group: 'drawing' },
    { id: 'tool_gradient', name: 'Gradient Tool', icon: 'palette', path: 'drawing/gradientTool.js', shortcut: 'Shift+G', group: 'drawing' },
    { id: 'tool_clone_stamp', name: 'Clone Stamp', icon: 'stamp', path: 'retouching/cloneStampTool.js', shortcut: 'S', group: 'drawing' },

    // 3. Shape & Geometry
    { id: 'tool_rectangle', name: 'Rectangle', icon: 'square', path: 'shapes/rectangleTool.js', shortcut: 'U', group: 'shape' },
    { id: 'tool_rounded_rect', name: 'Rounded Rectangle', icon: 'layout-template', path: 'shapes/roundedRectTool.js', group: 'shape' },
    { id: 'tool_ellipse', name: 'Ellipse', icon: 'circle', path: 'shapes/ellipseTool.js', shortcut: 'O', group: 'shape' },
    { id: 'tool_polygon', name: 'Polygon', icon: 'hexagon', path: 'shapes/polygonTool.js', group: 'shape' },
    { id: 'tool_star', name: 'Star', icon: 'star', path: 'shapes/starTool.js', group: 'shape' },
    { id: 'tool_line', name: 'Line', icon: 'minus', path: 'shapes/lineTool.js', shortcut: 'L', group: 'shape' },
    { id: 'tool_custom_shape', name: 'Custom Shape', icon: 'shapes', path: 'shapes/customShapeTool.js', group: 'shape' },
    { id: 'tool_grid_gen', name: 'Grid Generator', icon: 'grid-3x3', path: 'shapes/gridGenTool.js', group: 'shape' },
    { id: 'tool_spiral', name: 'Spiral', icon: 'tornado', path: 'shapes/spiralTool.js', group: 'shape' },
    { id: 'tool_heart', name: 'Heart Tool', icon: 'heart', path: 'shapes/heartTool.js', group: 'shape' },
    { id: 'tool_arrow', name: 'Arrow Tool', icon: 'arrow-up-right', path: 'shapes/arrowTool.js', group: 'shape' },
    { id: 'tool_blob', name: 'Blob Maker', icon: 'cloud', path: 'shapes/blobTool.js', group: 'shape' },
    { id: 'tool_wave', name: 'Wave Generator', icon: 'waves', path: 'shapes/waveTool.js', group: 'shape' },

    // 4. Path & Vector
    { id: 'tool_pen', name: 'Pen Tool', icon: 'pen', path: 'path/penTool.js', shortcut: 'P', group: 'path' },
    { id: 'tool_curve_pen', name: 'Curvature Pen', icon: 'spline', path: 'path/curvePenTool.js', group: 'path' },
    { id: 'tool_free_pen', name: 'Freeform Pen', icon: 'edit-3', path: 'path/freePenTool.js', group: 'path' },
    { id: 'tool_add_anchor', name: 'Add Anchor Point', icon: 'plus', path: 'path/addAnchorTool.js', group: 'path' },
    { id: 'tool_del_anchor', name: 'Delete Anchor Point', icon: 'minus', path: 'path/delAnchorTool.js', group: 'path' },
    { id: 'tool_convert_point', name: 'Convert Point', icon: 'corner-up-right', path: 'path/convertPointTool.js', group: 'path' },
    { id: 'tool_path_select', name: 'Path Selection', icon: 'mouse-pointer-click', path: 'path/pathSelectTool.js', group: 'path' },
    { id: 'tool_scissors', name: 'Scissors', icon: 'scissors', path: 'path/scissorsTool.js', group: 'path' },
    { id: 'tool_knife', name: 'Knife', icon: 'sword', path: 'path/knifeTool.js', group: 'path' },
    { id: 'tool_shape_builder', name: 'Shape Builder', icon: 'combine', path: 'path/shapeBuilderTool.js', group: 'path' },
    { id: 'tool_vector_warp', name: 'Vector Warp', icon: 'wrap-text', path: 'path/vectorWarpTool.js', group: 'path' },

    // 5. Text & Typography
    { id: 'tool_text', name: 'Horizontal Type', icon: 'type', path: 'text/textTool.js', shortcut: 'T', group: 'text' },
    { id: 'tool_text_vert', name: 'Vertical Type', icon: 'align-vertical-justify-start', path: 'text/textVertTool.js', group: 'text' },
    { id: 'tool_area_type', name: 'Area Type', icon: 'type', path: 'text/areaTypeTool.js', group: 'text' },
    { id: 'tool_path_type', name: 'Type on a Path', icon: 'baseline', path: 'text/pathTypeTool.js', group: 'text' },
    { id: 'tool_text_warp', name: 'Text Warp', icon: 'wrap-text', path: 'text/textWarpTool.js', group: 'text' },
    { id: 'tool_var_font', name: 'Variable Font', icon: 'sliders-horizontal', path: 'text/varFontTool.js', group: 'text' },
    { id: 'tool_drop_cap', name: 'Drop Cap', icon: 'heading', path: 'text/dropCapTool.js', group: 'text' },
    { id: 'tool_glyph', name: 'Glyph Insert', icon: 'pilcrow', path: 'text/glyphTool.js', group: 'text' },
    { id: 'tool_touch_type', name: 'Touch Type', icon: 'letter-text', path: 'text/touchTypeTool.js', group: 'text' },
    { id: 'tool_kerning', name: 'Kerning Tool', icon: 'move-horizontal', path: 'text/kerningTool.js', group: 'text' },

    // 6. Retouching & Healing
    { id: 'tool_spot_heal', name: 'Spot Healing Brush', icon: 'crosshair', path: 'retouching/spotHealTool.js', shortcut: 'J', group: 'retouch' },
    { id: 'tool_heal', name: 'Healing Brush', icon: 'cross', path: 'retouching/healTool.js', group: 'retouch' },
    { id: 'tool_patch', name: 'Patch Tool', icon: 'scan-face', path: 'retouching/patchTool.js', group: 'retouch' },
    { id: 'tool_ca_move', name: 'Content-Aware Move', icon: 'move', path: 'retouching/contentAwareTool.js', group: 'retouch' },
    { id: 'tool_red_eye', name: 'Red Eye Tool', icon: 'eye-off', path: 'retouching/redEyeTool.js', group: 'retouch' },
    { id: 'tool_dodge', name: 'Dodge Tool', icon: 'sun', path: 'retouching/dodgeTool.js', shortcut: 'O', group: 'retouch' },
    { id: 'tool_burn', name: 'Burn Tool', icon: 'moon', path: 'retouching/burnTool.js', group: 'retouch' },
    { id: 'tool_sponge', name: 'Sponge Tool', icon: 'droplet', path: 'retouching/spongeTool.js', group: 'retouch' },
    { id: 'tool_blur', name: 'Blur Tool', icon: 'droplets', path: 'retouching/blurTool.js', group: 'retouch' },
    { id: 'tool_sharpen', name: 'Sharpen Tool', icon: 'zap', path: 'retouching/sharpenTool.js', group: 'retouch' },
    { id: 'tool_smudge', name: 'Smudge Tool', icon: 'pointer', path: 'retouching/smudgeTool.js', group: 'retouch' },

    // 7. CSS & UI Effect
    { id: 'tool_drop_shadow', name: 'Drop Shadow Gizmo', icon: 'box-select', path: 'css/dropShadowTool.js', group: 'css' },
    { id: 'tool_glow', name: 'Inner/Outer Glow', icon: 'sun-snow', path: 'css/glowTool.js', group: 'css' },
    { id: 'tool_filter_brush', name: 'CSS Filter Brush', icon: 'filter', path: 'css/filterBrushTool.js', group: 'css' },
    { id: 'tool_radius_drag', name: 'Border Radius Dragger', icon: 'corner-down-right', path: 'css/radiusDragTool.js', group: 'css' },
    { id: 'tool_glass', name: 'Glassmorphism', icon: 'component', path: 'css/glassTool.js', group: 'css' },
    { id: 'tool_neumorph', name: 'Neumorphism', icon: 'layers', path: 'css/neumorphTool.js', group: 'css' },
    { id: 'tool_grad_mesh', name: 'Gradient Mesh', icon: 'grid', path: 'css/gradMeshTool.js', group: 'css' },
    { id: 'tool_box_model', name: 'Box Model Inspector', icon: 'box', path: 'css/boxModelTool.js', group: 'css' },
    { id: 'tool_grid_build', name: 'CSS Grid Builder', icon: 'layout-grid', path: 'css/gridBuildTool.js', group: 'css' },
    { id: 'tool_flex_align', name: 'Flexbox Aligner', icon: 'align-center', path: 'css/flexAlignTool.js', group: 'css' },
    { id: 'tool_z_index', name: 'Z-Index Picker', icon: 'layers', path: 'css/zIndexTool.js', group: 'css' },
    { id: 'tool_transform_gizmo', name: 'Transform Gizmo', icon: 'rotate-3d', path: 'css/transformGizmoTool.js', group: 'css' },

    // 8. Layout, Canvas & Utility
    { id: 'tool_artboard', name: 'Artboard Tool', icon: 'layout-panel-left', path: 'layout/artboardTool.js', group: 'layout' },
    { id: 'tool_slice', name: 'Slice Tool', icon: 'slice', path: 'layout/sliceTool.js', shortcut: 'C', group: 'layout' },
    { id: 'tool_slice_sel', name: 'Slice Select', icon: 'pointer', path: 'layout/sliceSelectTool.js', group: 'layout' },
    { id: 'tool_frame', name: 'Frame Tool', icon: 'frame', path: 'layout/frameTool.js', group: 'layout' },
    { id: 'tool_ruler', name: 'Ruler Tool', icon: 'ruler', path: 'layout/rulerTool.js', group: 'layout' },
    { id: 'tool_guides', name: 'Guides Manager', icon: 'align-vertical-space-around', path: 'layout/guidesTool.js', group: 'layout' },
    { id: 'tool_hand', name: 'Hand Tool', icon: 'hand', path: 'layout/handTool.js', shortcut: 'H', group: 'layout' },
    { id: 'tool_zoom', name: 'Zoom Tool', icon: 'zoom-in', path: 'layout/zoomTool.js', shortcut: 'Z', group: 'layout' },
    { id: 'tool_rotate_view', name: 'Rotate View', icon: 'rotate-cw', path: 'layout/rotateViewTool.js', shortcut: 'R', group: 'layout' },
    { id: 'tool_eyedropper', name: 'Eyedropper', icon: 'pipette', path: 'layout/eyedropperTool.js', shortcut: 'I', group: 'layout' },
    { id: 'tool_note', name: 'Note/Comment', icon: 'message-square', path: 'layout/noteTool.js', group: 'layout' },
    { id: 'tool_count', name: 'Count Tool', icon: 'hash', path: 'layout/countTool.js', group: 'layout' },

    // 9. AI & Generative
    { id: 'tool_gen_fill', name: 'Generative Fill', icon: 'wand-2', path: 'ai/genFillTool.js', group: 'ai' },
    { id: 'tool_gen_expand', name: 'Generative Expand', icon: 'expand', path: 'ai/genExpandTool.js', group: 'ai' },
    { id: 'tool_bg_remove', name: 'Background Remover', icon: 'image-minus', path: 'ai/bgRemoveTool.js', group: 'ai' },
    { id: 'tool_colorize', name: 'Auto-Colorize', icon: 'palette', path: 'ai/colorizeTool.js', group: 'ai' },
    { id: 'tool_upscale', name: 'AI Upscaler', icon: 'maximize', path: 'ai/upscaleTool.js', group: 'ai' },
    { id: 'tool_style_transfer', name: 'Style Transfer', icon: 'brush', path: 'ai/styleTransferTool.js', group: 'ai' },
    { id: 'tool_wire_ui', name: 'Wireframe-to-UI', icon: 'layout', path: 'ai/wireUiTool.js', group: 'ai' },
    { id: 'tool_img_css', name: 'Image-to-CSS', icon: 'code', path: 'ai/imgCssTool.js', group: 'ai' },

    // 10. 3D & Advanced Transforms
    { id: 'tool_free_trans', name: 'Free Transform', icon: 'scaling', path: '3d/freeTransTool.js', shortcut: 'Ctrl+T', group: '3d' },
    { id: 'tool_persp_warp', name: 'Perspective Warp', icon: 'box', path: '3d/perspWarpTool.js', group: '3d' },
    { id: 'tool_puppet_warp', name: 'Puppet Warp', icon: 'git-commit', path: '3d/puppetWarpTool.js', group: '3d' },
    { id: 'tool_3d_extrude', name: '3D Extrude (CSS)', icon: 'box-select', path: '3d/extrudeTool.js', group: '3d' },
    { id: 'tool_distort', name: 'Distort Tool', icon: 'move-diagonal', path: '3d/distortTool.js', group: '3d' },
    { id: 'tool_skew', name: 'Skew Tool', icon: 'move-horizontal', path: '3d/skewTool.js', group: '3d' },
    { id: 'tool_3d_material', name: '3D Material Picker', icon: 'layers', path: '3d/materialTool.js', group: '3d' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Render the 100+ tools grouped to UI
    const container = document.getElementById('dynamic-tools-container');
    if (container) {
        let currentGroup = '';
        let groupDiv = null;

        toolsRegistry.forEach((tool, index) => {
            if (tool.group !== currentGroup) {
                // Add divider between groups (except first)
                if (currentGroup !== '') {
                    const divider = document.createElement('div');
                    divider.className = 'toolbox-divider';
                    container.appendChild(divider);
                }
                
                groupDiv = document.createElement('div');
                groupDiv.className = 'toolbox-group';
                container.appendChild(groupDiv);
                
                currentGroup = tool.group;
            }

            const btn = document.createElement('button');
            btn.className = 'toolbox-btn';
            btn.dataset.tool = tool.id;
            btn.title = tool.name + (tool.shortcut ? ` (${tool.shortcut})` : '');
            btn.innerHTML = `<i data-lucide="${tool.icon}"></i>`;
            
            groupDiv.appendChild(btn);
        });

        // Initialize icons after adding to DOM
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Wait slightly so that window.canvasEditor is initialized by app.js
    setTimeout(() => {
        window.toolManager = new ToolManager(window.canvasEditor);

        // Register all tools
        toolsRegistry.forEach(tool => window.toolManager.registerTool(tool));
        
        // Listen to UI buttons
        document.querySelectorAll('.toolbox-btn[data-tool]')?.forEach(btn => {
            btn?.addEventListener('click', (e) => {
                const toolId = e.currentTarget.dataset.tool;
                if (toolId) {
                    window.toolManager.activateTool(toolId);
                }
            });
        });
        
        // Activate default tool
        window.toolManager.activateTool('tool_move');
    }, 100);
});


/* --- js/app.js --- */
/* DesignCraft Main Application Coordinator
   Initializes the workspace, sets up toolbar bindings, manages global application
   states (tool selection, themes, baseline snaps), and handles undo/redo coordinator. */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Vector Icons
    lucide.createIcons();

    // 2. Toolbar Bindings (Insert Element Tools)
    const btnSelect = document.getElementById('tb-select');
    const btnText = document.getElementById('tb-text');
    const shapeOptions = [
        { id: 'tb-rect', shape: 'rectangle' },
        { id: 'tb-circle', shape: 'circle' },
        { id: 'tb-triangle', shape: 'triangle' },
        { id: 'tb-star', shape: 'star' },
        { id: 'tb-line', shape: 'line' }
    ];
    const btnClear = document.getElementById('action-clear');
    
    let activeTool = 'select'; // select, text, shape

    const setActiveTool = (toolName, btnEl) => {
        activeTool = toolName;
        document.querySelectorAll('.tool-btn')?.forEach(btn => {
            btn.classList.remove('active');
        });
        if (btnEl) btnEl.classList.add('active');
    };

    if (btnSelect) {
        btnSelect?.addEventListener('click', () => setActiveTool('select', btnSelect));
    }
    
    if (btnText) {
        btnText?.addEventListener('click', () => {
            setActiveTool('select', btnSelect); // Keep selection pointer active
            window.canvasEditor.addText();
        });
    }

    shapeOptions.forEach(opt => {
        const btn = document.getElementById(opt.id);
        if (btn) {
            btn.addEventListener('click', () => {
                setActiveTool('select', btnSelect); // Keep selection active
                window.canvasEditor.addShape(opt.shape);
            });
        }
    });

    // 2.5 Image Import
    const btnImage = document.getElementById('tb-image');
    const imageUploadInput = document.getElementById('image-upload-input');
    if (btnImage && imageUploadInput) {
        btnImage?.addEventListener('click', () => {
            imageUploadInput.click();
        });

        imageUploadInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const imgDataUrl = event.target.result;
                
                // Create an image element on the canvas
                const el = document.createElement('div');
                el.className = 'canvas-element';
                el.id = `el-${Date.now()}`;
                el.dataset.type = 'image';
                el.dataset.name = `Image ${++window.canvasEditor.elementCounter}`;
                
                el.style.left = '100px';
                el.style.top = '100px';
                el.style.width = '200px';
                el.style.height = '200px';
                el.style.backgroundImage = `url(${imgDataUrl})`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.backgroundRepeat = 'no-repeat';
                el.style.zIndex = window.canvasEditor.getMaxZIndex() + 1;
                
                window.canvasEditor.artboard.appendChild(el);
                window.canvasEditor.selectElement(el);
                window.canvasEditor.triggerHistorySave();
                window.canvasEditor.updateElementsCount();
                if (window.controlsManager) window.controlsManager.updateLayersList();
            };
            reader.readAsDataURL(file);
            
            // Reset input so the same file can be selected again
            e.target.value = '';
        });
    }

    // 3. Toolbar Undo/Redo & Clear Actions
    const btnUndo = document.getElementById('action-undo');
    const btnRedo = document.getElementById('action-redo');

    btnUndo?.addEventListener('click', () => {
        const currentSnapshot = window.canvasEditor.getSnapshot();
        const prevSnapshot = window.historyManager.undo(currentSnapshot);
        if (prevSnapshot !== null) {
            window.canvasEditor.loadSnapshot(prevSnapshot);
        }
    });

    btnRedo?.addEventListener('click', () => {
        const currentSnapshot = window.canvasEditor.getSnapshot();
        const nextSnapshot = window.historyManager.redo(currentSnapshot);
        if (nextSnapshot !== null) {
            window.canvasEditor.loadSnapshot(nextSnapshot);
        }
    });

    btnClear?.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear the canvas? All elements will be deleted.")) {
            // Remove all canvas element nodes
            const artboard = document.getElementById('paint-artboard');
            const elements = artboard.querySelectorAll('.canvas-element');
            elements.forEach(el => el.remove());
            
            window.canvasEditor.deselectAll();
            window.canvasEditor.updateElementsCount();
            window.canvasEditor.triggerHistorySave();
            
            if (window.controlsManager) {
                window.controlsManager.updateLayersList();
            }
        }
    });

    // 4. Dark & Light Theme Switcher
    const themeBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('designcraft_theme') || 'dark';

    if (currentTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }

    themeBtn?.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('designcraft_theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('designcraft_theme', 'dark');
        }
    });

    // 5. Initialize Blank Baseline History Snapshot
    const baseline = window.canvasEditor.getSnapshot();
    window.historyManager.saveState(baseline);
    
    // Set up default canvas details
    window.canvasEditor.updateElementsCount();
    if (window.controlsManager) {
        window.controlsManager.updateLayersList();
    }

    // 6. Web Audio Soundscape Manager
    let audioCtx = null;
    let userHasInteracted = false;
    document.addEventListener('click', () => userHasInteracted = true, { once: true, capture: true });
    document.addEventListener('keydown', () => userHasInteracted = true, { once: true, capture: true });

    function playUISound(type) {
        if (!userHasInteracted) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const now = audioCtx.currentTime;
            
            if (type === 'click') {
                // Short organic pop sound: frequency sweep 350Hz -> 80Hz in 0.08s
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(85, now + 0.08);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'hover') {
                // Ultra-short muted click: high frequency, decaying very quickly
                osc.frequency.setValueAtTime(1000, now);
                gainNode.gain.setValueAtTime(0.015, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === 'success') {
                // High-end soft double chime
                const osc2 = audioCtx.createOscillator();
                const gainNode2 = audioCtx.createGain();
                osc2.connect(gainNode2);
                gainNode2.connect(audioCtx.destination);
                
                // First note: C5 (523Hz)
                osc.frequency.setValueAtTime(523.25, now);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                
                // Second note: E5 (659Hz) delayed by 0.07s
                osc2.frequency.setValueAtTime(659.25, now + 0.07);
                gainNode2.gain.setValueAtTime(0.08, now + 0.07);
                gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.37);
                
                osc.start(now);
                osc.stop(now + 0.3);
                osc2.start(now + 0.07);
                osc2.stop(now + 0.37);
            }
        } catch (e) {
            console.warn("Audio Context blocked or unsupported", e);
        }
    }
    window.playUISound = playUISound;

    // Global sound triggers
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .tab-btn, .swatch-color, .swatch-gradient, .preset-card, .code-tab');
        if (target) {
            playUISound('click');
        }
    });

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, .tab-btn, .swatch-color, .swatch-gradient, .preset-card, .code-tab');
        if (target && !target.dataset.hoverSoundPlayed) {
            playUISound('hover');
            // Prevent spamming hover sound on same session mouse moves
            target.dataset.hoverSoundPlayed = 'true';
            setTimeout(() => { target.removeAttribute('data-hover-sound-played'); }, 300);
        }
    });

    // === MINIMAL TOOLBAR BINDINGS ===
    const setToolActive = (id) => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(id);
        if (btn) btn.classList.add('active');
    };

    document.getElementById('tb-select')?.addEventListener('click', () => {
        setToolActive('tb-select');
    });

    document.getElementById('tb-text')?.addEventListener('click', () => {
        setToolActive('tb-text');
        window.canvasEditor?.addText();
    });

    document.getElementById('tb-rect')?.addEventListener('click', () => {
        setToolActive('tb-rect');
        window.canvasEditor?.addShape('rectangle');
    });

    document.getElementById('tb-circle')?.addEventListener('click', () => {
        setToolActive('tb-circle');
        window.canvasEditor?.addShape('circle');
    });

    document.getElementById('tb-triangle')?.addEventListener('click', () => {
        setToolActive('tb-triangle');
        window.canvasEditor?.addShape('triangle');
    });

    document.getElementById('tb-star')?.addEventListener('click', () => {
        setToolActive('tb-star');
        window.canvasEditor?.addShape('star');
    });

    document.getElementById('tb-line')?.addEventListener('click', () => {
        setToolActive('tb-line');
        window.canvasEditor?.addShape('line');
    });

    document.getElementById('tb-image')?.addEventListener('click', () => {
        setToolActive('tb-image');
        document.getElementById('image-upload-input')?.click();
    });

    document.getElementById('tb-ai')?.addEventListener('click', () => {
        setToolActive('tb-ai');
        // Open AI panel tab in the left sidebar
        const aiTab = document.querySelector('[data-tab="ai-panel"]') || document.querySelector('.tab-btn[data-tab="ai-panel"]');
        if (aiTab) aiTab.click();
    });
});


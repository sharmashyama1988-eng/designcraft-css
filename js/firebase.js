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
        this.btnLoginTrigger.addEventListener('click', () => {
            this.modalAuth.classList.remove('hidden');
            this.resetAuthForm();
        });
        this.modalAuthClose.addEventListener('click', () => this.modalAuth.classList.add('hidden'));
        
        document.getElementById('btn-open-firebase-config').addEventListener('click', () => {
            this.modalConfig.classList.remove('hidden');
            this.populateConfigForm();
        });
        
        document.getElementById('btn-auth-settings').addEventListener('click', () => {
            this.modalAuth.classList.add('hidden');
            this.modalConfig.classList.remove('hidden');
            this.populateConfigForm();
        });
        
        this.modalConfigClose.addEventListener('click', () => this.modalConfig.classList.add('hidden'));
        
        this.btnOpenProjects.addEventListener('click', () => {
            this.modalProjects.classList.remove('hidden');
            this.loadAndRenderProjects();
        });
        this.modalProjectsClose.addEventListener('click', () => this.modalProjects.classList.add('hidden'));
        
        // Save current canvas click
        this.btnSave.addEventListener('click', () => this.saveCurrentProject());

        // Toggle Auth Registration/Login modes
        let isSignUpMode = false;
        this.authToggleLink.addEventListener('click', (e) => {
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
        this.authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
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
            this.btnGoogleSignIn.addEventListener('click', async () => {
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
        this.btnLogout.addEventListener('click', () => {
            if (this.auth) {
                this.auth.signOut();
            }
            this.user = null;
            this.updateAuthUi(null);
        });

        // Use Offline fallbacks
        document.getElementById('btn-auth-local').addEventListener('click', (e) => {
            e.preventDefault();
            this.localMode = true;
            this.updateAuthUi(null);
            this.modalAuth.classList.add('hidden');
        });

        // Save Custom Configuration
        document.getElementById('btn-save-firebase-config').addEventListener('click', () => {
            const apiKey = document.getElementById('fb-apiKey').value.trim();
            const authDomain = document.getElementById('fb-authDomain').value.trim();
            const projectId = document.getElementById('fb-projectId').value.trim();
            const storageBucket = document.getElementById('fb-storageBucket').value.trim();
            const messagingSenderId = document.getElementById('fb-messagingSenderId').value.trim();
            const appId = document.getElementById('fb-appId').value.trim();

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
            document.getElementById('fb-apiKey').value = config.apiKey || '';
            document.getElementById('fb-authDomain').value = config.authDomain || '';
            document.getElementById('fb-projectId').value = config.projectId || '';
            document.getElementById('fb-storageBucket').value = config.storageBucket || '';
            document.getElementById('fb-messagingSenderId').value = config.messagingSenderId || '';
            document.getElementById('fb-appId').value = config.appId || '';
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
        const canvasBg = document.getElementById('paint-artboard').style.backgroundColor || "#121216";
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

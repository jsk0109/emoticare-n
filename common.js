// Import Firebase
// Firebase 9 (모듈식) 사용 권장, 현재 코드는 compat 버전 기준
// import { initializeApp } from "firebase/app";
// import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
// import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, deleteDoc, where, getDocs } from "firebase/firestore";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAq6EAevOq0re2pJTwmkj4xz7SUtqBq2tA",
  authDomain: "emoticare-n.firebaseapp.com",
  projectId: "emoticare-n",
  storageBucket: "emoticare-n.appspot.com",
  messagingSenderId: "699658778766",
  appId: "1:699658778766:web:c5eaf7c7f1832b3c3671df",
  measurementId: "G-QPTE3B8E8V"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Firestore 컬렉션 이름 한글 매핑
const 컬렉션_이름_맵 = {
  색상일기: 'emotions',
  감정편지: 'emotionLetters',
  하루기분기록: 'moodRoutines',
  성찰기록: 'reflections',
  저장된힐링카드: 'savedCards',
  피드백: 'feedbacks' // 피드백 컬렉션 추가 (필요시)
};

// 현재 사용자
let currentUser = null;
let authStateResolved = false;

// DOM 로드 완료 시 실행
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and parsed. Initializing common scripts.");
  const mainElement = document.querySelector('main');
  const headerContainer = document.getElementById("header-container");

  if (mainElement) {
    mainElement.style.opacity = '0';
    mainElement.style.transition = 'opacity 0.3s ease-in-out';
  }
  if (headerContainer) {
    headerContainer.style.opacity = '0';
  }

  const headerPromise = loadHeader();
  const footerPromise = loadFooter();

  await Promise.all([headerPromise, footerPromise]);
  console.log("Header and Footer HTML loaded.");

  setupAuth();

  const waitForAuth = new Promise(resolve => {
    if (authStateResolved) {
      console.log("Auth state was already resolved.");
      resolve();
    } else {
      document.addEventListener('authStateReady', function onAuthReady() {
        console.log("authStateReady event received in DOMContentLoaded listener.");
        resolve();
      }, { once: true });
    }
  });

  await waitForAuth;
  console.log("Auth state confirmed resolved. Making main content visible.");

  if (headerContainer) {
    requestAnimationFrame(() => {
        headerContainer.style.opacity = '1';
    });
  }
  if (mainElement) {
    requestAnimationFrame(() => {
        mainElement.style.opacity = '1';
    });
  }
});

// 헤더 로드
async function loadHeader() {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) {
    console.error("Header container (header-container) not found in the DOM.");
    return;
  }
  try {
    const response = await fetch("header.html");
    if (!response.ok) {
      console.error(`Failed to fetch header.html: ${response.status} ${response.statusText}`);
      headerContainer.innerHTML = `<p style="color:red; text-align:center; padding:10px;">Error: Could not load header (${response.status}).</p>`;
      return;
    }
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;
    setupMobileMenu();
    setActiveNavItem();
    console.log("Header loaded and initialized successfully.");
  } catch (error) {
    console.error("Error in loadHeader function:", error);
    headerContainer.innerHTML = `<p style="color:red; text-align:center; padding:10px;">Error: Exception while loading header. Check console.</p>`;
  }
}

// 푸터 로드
async function loadFooter() {
  const footerContainer = document.getElementById("footer-container");
  if (!footerContainer) {
    console.error("Footer container (footer-container) not found in the DOM.");
    return;
  }
  try {
    const response = await fetch("footer.html");
    if (!response.ok) {
      console.error(`Failed to fetch footer.html: ${response.status} ${response.statusText}`);
      footerContainer.innerHTML = `<p style="color:red; text-align:center; padding:10px;">Error: Could not load footer (${response.status}).</p>`;
      return;
    }
    const footerHTML = await response.text();
    footerContainer.innerHTML = footerHTML;
    const currentYearSpan = document.getElementById("currentYear");
    if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear();
    }
    console.log("Footer loaded successfully.");
  } catch (error) {
    console.error("Error in loadFooter function:", error);
    footerContainer.innerHTML = `<p style="color:red; text-align:center; padding:10px;">Error: Exception while loading footer. Check console.</p>`;
  }
}

// 모바일 메뉴 설정
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle")
  const navMenu = document.getElementById("navMenu")
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active")
      this.classList.toggle("active");
    });
  }
}

// 현재 페이지에 해당하는 네비게이션 아이템 활성화
function setActiveNavItem() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  const navLinks = document.querySelectorAll(".nav-menu a")
  if (navLinks) {
    navLinks.forEach((link) => {
      const href = link.getAttribute("href").split("/").pop();
      if (href === currentPage) {
        link.classList.add("active");
      }
    });
  }
}

// 인증 설정
function setupAuth() {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    console.log("onAuthStateChanged triggered. User:", currentUser ? currentUser.uid : "null");
    updateAuthUI(user);
    authStateResolved = true;
    const event = new CustomEvent('authStateReady', { detail: { user: currentUser } });
    console.log("Dispatching authStateReady event.");
    document.dispatchEvent(event);
  });
}

// 인증 UI 업데이트
function updateAuthUI(user) {
  const loginButtonContainer = document.getElementById("loginButtonContainer")
  if (!loginButtonContainer) {
    console.warn("updateAuthUI: loginButtonContainer not found. Header might not be fully initialized.");
    return;
  }
  if (user) {
    loginButtonContainer.innerHTML = `
            <div class="user-info">
                <span>${user.displayName || user.email}님</span>
                <button class="btn-outline" onclick="logout()">로그아웃</button>
            </div>
        `;
  } else {
    loginButtonContainer.innerHTML = `
            <button class="btn-outline" onclick="showLoginModal()">로그인</button>
            <button class="btn-primary" onclick="showSignupModal()">회원가입</button>
        `;
  }
}

// 로그인 모달 표시
function showLoginModal() {
  closeAllModals();
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "loginModal"
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>로그인</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">이메일</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">비밀번호</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem; margin-bottom: 0.75rem;">
                    <i class="fas fa-envelope" style="margin-right: 0.5rem;"></i>이메일로 로그인
                </button>
                <button type="button" class="btn-secondary btn-google" style="width: 100%; justify-content: center; margin-bottom: 0.75rem;" onclick="handleGoogleLogin()">
                    <i class="fab fa-google" style="margin-right: 0.5rem;"></i> 구글로 로그인
                </button>
                <p class="text-center" style="font-size: 0.9em; margin-bottom: 0.5rem;">
                    <a href="#" onclick="showEmailLookupModal(); return false;">가입 이메일 확인</a>
                    <span style="margin: 0 0.5rem;">|</span> <a href="#" onclick="showForgotPasswordModal(); return false;">비밀번호 찾기</a>
                </p>
                <p class="text-center">
                    계정이 없으신가요? <a href="#" onclick="switchToSignupModal()">회원가입</a>
                </p>
                <p class="mt-1 text-center" style="font-size: 0.8em; color: #777;">
                    로그인/회원가입 시 <a href="#" onclick="showTerms(); return false;">이용약관</a> 및 <a href="#" onclick="showPrivacyPolicy(); return false;">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
                </p>
            </form>
        </div>
    `
  document.body.appendChild(modal)
  modal.style.display = "block"
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal(modal.querySelector('.modal-close'));
    }
  });
}

// 회원가입 모달 표시
function showSignupModal() {
  closeAllModals();
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "signupModal" // ID 추가
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>회원가입</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <form id="signupForm">
                <div class="form-group">
                    <label for="signupEmail">이메일</label>
                    <input type="email" id="signupEmail" required>
                </div>
                <div class="form-group">
                    <label for="signupPassword">비밀번호</label>
                    <input type="password" id="signupPassword" required>
                </div>
                <div class="form-group">
                    <label for="displayName">닉네임</label>
                    <input type="text" id="displayName" placeholder="사용하실 닉네임을 입력하세요" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem; margin-bottom: 0.75rem;">
                    <i class="fas fa-user-plus" style="margin-right: 0.5rem;"></i>이메일로 회원가입
                </button>
                <button type="button" class="btn-secondary btn-google" style="width: 100%; justify-content: center; margin-bottom: 1.5rem;" onclick="handleGoogleLogin()">
                    <i class="fab fa-google" style="margin-right: 0.5rem;"></i> 구글로 회원가입
                </button>
                <p class="mt-2 text-center">
                    이미 계정이 있으신가요? <a href="#" onclick="switchToLoginModal()">로그인</a>
                </p>
                <p class="mt-1 text-center" style="font-size: 0.8em; color: #777;">
                    회원가입 시 <a href="#" onclick="showTerms(); return false;">이용약관</a> 및 <a href="#" onclick="showPrivacyPolicy(); return false;">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
                </p>
            </form>
        </div>
    `
  document.body.appendChild(modal)
  modal.style.display = "block"
  document.getElementById("signupForm").addEventListener("submit", handleSignup);
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal(modal.querySelector('.modal-close'));
    }
  });
}

// 가입 이메일 확인 모달 표시 함수
function showEmailLookupModal() {
    closeAllModals();
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "emailLookupModal";
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>가입 이메일 확인</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <form id="emailLookupForm">
                <p style="margin-bottom: 1rem; font-size: 0.9em; color: #555;">
                    가입 여부를 확인할 이메일 주소를 입력해주세요.
                </p>
                <div class="form-group">
                    <label for="lookupEmail">이메일</label>
                    <input type="email" id="lookupEmail" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                    확인하기
                </button>
                <div id="emailLookupResult" class="mt-2 text-center" style="font-size: 0.9em;"></div>
                 <p class="mt-2 text-center">
                    <a href="#" onclick="switchToLoginModal()">로그인으로 돌아가기</a>
                </p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = "block";
    document.getElementById("emailLookupForm").addEventListener("submit", handleEmailLookup);
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal(modal.querySelector('.modal-close'));
        }
    });
}

// 비밀번호 찾기 모달 표시 함수
function showForgotPasswordModal() {
    closeAllModals();
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "forgotPasswordModal";
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>비밀번호 찾기</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <form id="forgotPasswordForm">
                <p style="margin-bottom: 1rem; font-size: 0.9em; color: #555;">
                    가입 시 사용한 이메일 주소를 입력해주세요. 비밀번호 재설정 링크를 보내드립니다.
                </p>
                <div class="form-group">
                    <label for="forgotEmail">이메일</label>
                    <input type="email" id="forgotEmail" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">
                    재설정 메일 발송
                </button>
                <div id="forgotPasswordResult" class="mt-2 text-center" style="font-size: 0.9em;"></div>
                 <p class="mt-2 text-center">
                    <a href="#" onclick="switchToLoginModal()">로그인으로 돌아가기</a>
                </p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = "block";
    document.getElementById("forgotPasswordForm").addEventListener("submit", handleForgotPassword);
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal(modal.querySelector('.modal-close'));
        }
    });
}

function switchToSignupModal() {
    closeAllModals();
    showSignupModal();
}
function switchToLoginModal() {
    closeAllModals();
    showLoginModal();
}

// 로그인 처리
async function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  try {
    await auth.signInWithEmailAndPassword(email, password)
    closeAllModals();
    showMessage("로그인되었습니다.", "success");
  } catch (error) {
    let errorMessage = "로그인 실패: 알 수 없는 오류가 발생했습니다.";
    switch (error.code) {
      case 'auth/invalid-email': errorMessage = "유효하지 않은 이메일 주소입니다."; break;
      case 'auth/user-disabled': errorMessage = "사용 중지된 계정입니다."; break;
      case 'auth/user-not-found': errorMessage = "존재하지 않는 사용자입니다."; break;
      case 'auth/wrong-password': errorMessage = "잘못된 비밀번호입니다."; break;
      case 'auth/too-many-requests': errorMessage = "너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요."; break;
    }
    showMessage(errorMessage, "error");
  }
}

// 회원가입 처리
async function handleSignup(e) {
  e.preventDefault()
  const email = document.getElementById("signupEmail").value
  const password = document.getElementById("signupPassword").value
  const displayName = document.getElementById("displayName").value
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password)
    await userCredential.user.updateProfile({
      displayName: displayName,
    });
    closeAllModals();
    showMessage("회원가입이 완료되었습니다. 이제 로그인할 수 있습니다.", "success");
  } catch (error) {
    let errorMessage = "회원가입 실패: 알 수 없는 오류가 발생했습니다.";
    switch (error.code) {
      case 'auth/email-already-in-use': errorMessage = "이미 사용 중인 이메일 주소입니다."; break;
      case 'auth/invalid-email': errorMessage = "유효하지 않은 이메일 주소입니다."; break;
      case 'auth/weak-password': errorMessage = "비밀번호는 6자 이상이어야 합니다."; break;
    }
    showMessage(errorMessage, "error");
  }
}

// 구글 로그인 처리
async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        closeAllModals();
        showMessage("구글 계정으로 로그인되었습니다.", "success");
    } catch (error) {
        console.error("Google 로그인 실패:", error);
        let errorMessage = "Google 로그인 실패: " + error.message;
        if (error.code === 'auth/popup-closed-by-user') errorMessage = "Google 로그인 팝업이 닫혔습니다.";
        if (error.code === 'auth/cancelled-popup-request') errorMessage = "Google 로그인 요청이 중복되었습니다.";
        showMessage(errorMessage, "error");
    }
}

// 가입 이메일 확인 처리 함수 (로그 추가)
async function handleEmailLookup(e) {
    e.preventDefault();
    const email = document.getElementById("lookupEmail").value;
    const resultDiv = document.getElementById("emailLookupResult");
    resultDiv.innerHTML = '<span style="color: #555;">확인 중...</span>'; // 처리 중 메시지

    if (!email) {
        resultDiv.innerHTML = `<span style="color: red;">이메일을 입력해주세요.</span>`;
        return;
    }
    console.log(`[EmailLookup] Function called. Checking email: ${email}`);
    try {
        const signInMethods = await auth.fetchSignInMethodsForEmail(email);
        console.log(`[EmailLookup] Firebase fetchSignInMethodsForEmail for '${email}' returned:`, signInMethods);

        if (signInMethods && signInMethods.length > 0) {
            resultDiv.innerHTML = `<span style="color: green; font-weight: bold;">${email}</span> 은(는) 가입된 이메일입니다. <a href="#" onclick="showForgotPasswordModal(); return false;">비밀번호 찾기</a>`;
            console.log(`[EmailLookup] Email '${email}' IS registered. Methods: ${signInMethods.join(', ')}`);
        } else {
            resultDiv.innerHTML = `<span style="color: orange; font-weight: bold;">${email}</span> 은(는) 가입되지 않은 이메일입니다. 다시 확인해주세요.`;
            console.warn(`[EmailLookup] Email '${email}' is NOT registered (signInMethods array is empty).`);
        }
    } catch (error) {
        console.error("[EmailLookup] Error during email check:", error);
        let errorMessageText = "이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.";
        if (error.code === 'auth/invalid-email') {
            errorMessageText = "유효하지 않은 이메일 형식입니다.";
        } else if (error.code) { // 다른 Firebase 오류 코드도 표시
            errorMessageText = `오류가 발생했습니다 (${error.code}). 다시 시도해주세요.`;
        }
        resultDiv.innerHTML = `<span style="color: red;">${errorMessageText}</span>`;
    }
}

// 비밀번호 재설정 처리 함수
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value;
    const resultDiv = document.getElementById("forgotPasswordResult");
    resultDiv.innerHTML = '<span style="color: #555;">처리 중...</span>'; // 처리 중 메시지

    if (!email) {
        resultDiv.innerHTML = `<span style="color: red;">이메일을 입력해주세요.</span>`;
        return;
    }
    console.log(`[ForgotPassword] Attempting to send reset email to: ${email}`);
    try {
        await auth.sendPasswordResetEmail(email);
        resultDiv.innerHTML = `<span style="color: green;">비밀번호 재설정 이메일을 발송했습니다. 메일함을 확인해주세요.</span>`;
        console.log(`[ForgotPassword] Reset email sent successfully to: ${email}`);
    } catch (error) {
        console.error("[ForgotPassword] Error sending password reset email:", error);
        let errorMessage = "메일 발송에 실패했습니다. 이메일 주소를 확인해주세요.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "등록되지 않은 이메일 주소입니다.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "유효하지 않은 이메일 형식입니다.";
        } else if (error.code) {
            errorMessage = `메일 발송 실패 (${error.code}). 다시 시도해주세요.`;
        }
        resultDiv.innerHTML = `<span style="color: red;">${errorMessage}</span>`;
    }
}

// 로그아웃
async function logout() {
  try {
    await auth.signOut();
    localStorage.removeItem('moodRoutineData');
    localStorage.removeItem('emotionData');
    localStorage.removeItem('allEmotionLettersData');
    localStorage.removeItem('savedHealingCards');
    localStorage.removeItem('allMoodRoutineData');
    localStorage.removeItem('savedReflections');
    showMessage("로그아웃되었습니다.", "success");
  } catch (error) {
    showMessage("로그아웃 실패: " + error.message, "error");
  }
}

// 모달 닫기
function closeModal(element) {
  const modal = element.closest(".modal")
  if (modal) modal.remove(); // modal이 null이 아닐 때만 remove 호출
}

// 모든 모달 닫기
function closeAllModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    // 페이지에 정적으로 존재하는 모달(편지 관련)은 숨기기만 함
    if (modal.id === "lettersForDateModal" || modal.id === "letterModal" || 
        modal.id === "emotionModal" || modal.id === "moodRoutineDateModal" || 
        modal.id === "profileSettingsModal" || modal.id === "reflectionModal") {
      modal.style.display = "none";
    } else {
      // 동적으로 생성된 로그인/회원가입/약관/이메일확인/비번찾기 모달 등은 제거
      modal.remove();
    }
  });
}

// 메시지 표시
function showMessage(message, type = "info") {
  const existingMessage = document.querySelector('.message');
  const existingOverlay = document.querySelector('.message-overlay');
  if (existingMessage) existingMessage.remove();
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.className = "message-overlay";
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  let iconClass = '';
  if (type === 'success') iconClass = 'fas fa-check-circle';
  else if (type === 'error') iconClass = 'fas fa-times-circle';
  else if (type === 'info') iconClass = 'fas fa-info-circle';
  
  // HTML 문자열을 안전하게 삽입하기 위해 innerHTML 사용
  messageDiv.innerHTML = (iconClass ? `<i class="${iconClass}" style="margin-right: 10px; font-size: 1.2em;"></i> ` : '') + message;

  document.body.appendChild(overlay);
  document.body.appendChild(messageDiv);

  requestAnimationFrame(() => {
      overlay.classList.add('show');
      messageDiv.classList.add('show');
  });

  setTimeout(() => {
    if (messageDiv.parentNode) messageDiv.classList.remove('show'); // 부모 노드가 있을 때만 실행
    if (overlay.parentNode) overlay.classList.remove('show'); // 부모 노드가 있을 때만 실행
    
    const removeElements = () => {
        if (messageDiv.parentNode) messageDiv.remove();
        if (overlay.parentNode) overlay.remove();
    };

    // 트랜지션이 끝난 후 요소 제거 (더 확실한 방법)
    let transitionEndedCount = 0;
    const totalTransitions = 2; // messageDiv와 overlay

    const onTransitionEnd = () => {
        transitionEndedCount++;
        if (transitionEndedCount === totalTransitions) {
            removeElements();
        }
    };
    
    // 만약 트랜지션 이벤트가 지원되지 않거나, 요소가 이미 사라진 경우를 대비해 setTimeout도 유지
    if (messageDiv.parentNode) messageDiv.addEventListener('transitionend', onTransitionEnd, { once: true });
    else transitionEndedCount++;
    
    if (overlay.parentNode) overlay.addEventListener('transitionend', onTransitionEnd, { once: true });
    else transitionEndedCount++;

    // 안전장치: 트랜지션이 발생하지 않는 경우를 대비해 일정 시간 후 강제 제거
    setTimeout(removeElements, 3000); // 2.5초(사라짐 시작) + 0.5초(트랜지션 시간)

  }, 2500);
} 

// 개인정보처리방침 표시
function showPrivacyPolicy() {
  closeAllModals();
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "privacyPolicyModal" // ID 추가
  modal.innerHTML = `
        <div class="modal-content" style="max-height: 70vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>개인정보처리방침</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>EmotiCare 개인정보처리방침</strong></p>
                <p>최종 수정일: 2024년 6월 13일</p>
                <p>EmotiCare(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.</p>
                
                <h4>제1조 (개인정보의 수집 항목 및 이용 목적)</h4>
                <p>회사는 다음과 같은 목적으로 최소한의 개인정보를 수집하여 이용합니다.</p>
                <ol>
                    <li><strong>회원 가입 및 관리:</strong> 이메일 주소, 비밀번호, 닉네임 (회원 식별, 서비스 제공, 공지사항 전달 등)</li>
                    <li><strong>서비스 제공:</strong> 사용자가 입력하는 감정 기록, 감정 편지 내용, 하루 기분 기록, 성찰 기록, 저장된 힐링 카드 등 (서비스 핵심 기능 제공, 데이터 분석을 통한 맞춤형 콘텐츠 제공 - 익명화/가명화 처리 후)</li>
                    <li><strong>고객 지원 및 문의 응대:</strong> 이메일 주소, 문의 내용 (고객 문의 처리, 불만 처리 등)</li>
                    <li><strong>서비스 개선 및 신규 서비스 개발:</strong> 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보 (통계 분석, 맞춤형 서비스 제공, 신규 기능 개발 - 익명화/가명화 처리 후)</li>
                </ol>

                <h4>제2조 (개인정보의 보유 및 이용 기간)</h4>
                <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
                <ul>
                    <li>회원 탈퇴 시: 수집된 개인정보는 즉시 파기됩니다. 단, 법령에 의해 보존해야 하는 경우 해당 기간 동안 보존합니다.</li>
                    <li>서비스 이용 기록 (익명화/가명화 처리): 통계 분석 및 서비스 개선 목적으로 일정 기간 보관 후 파기될 수 있습니다.</li>
                </ul>

                <h4>제3조 (개인정보의 제3자 제공)</h4>
                <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
                <ul>
                    <li>이용자들이 사전에 동의한 경우</li>
                    <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>

                <h4>제4조 (개인정보의 파기절차 및 방법)</h4>
                <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.</p>
                <ul>
                    <li><strong>파기절차:</strong> 이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다.</li>
                    <li><strong>파기방법:</strong> 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                </ul>

                <h4>제5조 (이용자 및 법정대리인의 권리와 그 행사방법)</h4>
                <p>이용자 및 법정 대리인은 언제든지 등록되어 있는 자신 혹은 당해 만 14세 미만 아동의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다. 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다.</p>

                <h4>제6조 (개인정보 자동 수집 장치의 설치∙운영 및 거부에 관한 사항)</h4>
                <p>회사는 이용자에게 특화된 맞춤서비스를 제공하기 위해서 이용자들의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다. 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>

                <h4>제7조 (개인정보 보호책임자)</h4>
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <ul>
                    <li>개인정보 보호책임자: OOO</li>
                    <li>연락처: [이메일 주소 또는 전화번호]</li>
                </ul>
                <p>기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다.</p>
                <ul>
                    <li>개인정보침해신고센터 (www.118.or.kr / 국번없이 118)</li>
                    <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)</li>
                    <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
                </ul>
                <h4>제8조 (고지의 의무)</h4>
                <p>현 개인정보처리방침 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일전부터 홈페이지의 '공지사항'을 통해 고지할 것입니다.</p>
            </div>
        </div>
    `
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal(modal.querySelector('.modal-close'));
    }
  });
  document.body.appendChild(modal)
  modal.style.display = "block"
}

// 이용약관 표시
function showTerms() {
  closeAllModals();
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "termsModal" // ID 추가
  modal.innerHTML = `
        <div class="modal-content" style="max-height: 70vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>이용약관</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>EmotiCare 서비스 이용약관</strong></p>
                <p>최종 수정일: 2024년 6월 13일</p>

                <h4>제1조 (목적)</h4>
                <p>본 약관은 EmotiCare(이하 "회사")가 제공하는 마음챙김 및 감정 기록 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

                <h4>제2조 (용어의 정의)</h4>
                <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                <ol>
                    <li>"서비스"라 함은 회사가 제공하는 모든 마음챙김 관련 기능 및 콘텐츠를 의미합니다.</li>
                    <li>"회원"이라 함은 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</li>
                    <li>"아이디(ID)"라 함은 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 이메일 주소를 의미합니다.</li>
                    <li>"비밀번호"라 함은 회원이 부여 받은 아이디와 일치되는 회원임을 확인하고 비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을 의미합니다.</li>
                    <li>"게시물"이라 함은 회원이 서비스를 이용함에 있어 서비스상에 게시한 부호ㆍ문자ㆍ음성ㆍ화상 또는 동영상 등의 정보 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다. (예: 감정 기록, 감정 편지 등)</li>
                </ol>

                <h4>제3조 (약관의 게시와 개정)</h4>
                <ol>
                    <li>회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
                    <li>회사는 "약관의 규제에 관한 법률", "정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 "정보통신망법")" 등 관련법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                    <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일 전부터 적용일자 전일까지 공지합니다. 다만, 회원에게 불리한 약관의 개정의 경우에는 공지 외에 일정기간 서비스 내 전자우편, 전자쪽지, 로그인시 동의창 등의 전자적 수단을 통해 따로 명확히 통지하도록 합니다.</li>
                    <li>회사가 전항에 따라 개정약관을 공지 또는 통지하면서 회원에게 7일 기간 내에 의사표시를 하지 않으면 의사표시가 표명된 것으로 본다는 뜻을 명확하게 공지 또는 통지하였음에도 회원이 명시적으로 거부의 의사표시를 하지 아니한 경우 회원이 개정약관에 동의한 것으로 봅니다.</li>
                    <li>회원이 개정약관의 적용에 동의하지 않는 경우 회사는 개정 약관의 내용을 적용할 수 없으며, 이 경우 회원은 이용계약을 해지할 수 있습니다. 다만, 기존 약관을 적용할 수 없는 특별한 사정이 있는 경우에는 회사는 이용계약을 해지할 수 있습니다.</li>
                </ol>

                <h4>제4조 (서비스의 제공 및 변경)</h4>
                <ol>
                    <li>회사는 회원에게 아래와 같은 서비스를 제공합니다.
                        <ul>
                            <li>색상 감정 일기 기록 및 통계 기능</li>
                            <li>감정 편지 작성 및 보관 기능</li>
                            <li>하루 기분 기록 및 루틴 관리 기능</li>
                            <li>힐링 카드 및 치유 명언 제공 기능</li>
                            <li>성찰 질문 제공 및 기록 기능</li>
                            <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                        </ul>
                    </li>
                    <li>회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.</li>
                    <li>서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등은 그 변경 전에 해당 서비스 초기화면에 게시하여야 합니다.</li>
                </ol>

                <h4>제5조 (회원의 의무)</h4>
                <ol>
                    <li>회원은 다음 행위를 하여서는 안 됩니다.
                        <ul>
                            <li>타인의 정보 도용</li>
                            <li>회사가 게시한 정보의 변경</li>
                            <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                            <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                            <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                            <li>기타 불법적이거나 부당한 행위</li>
                        </ul>
                    </li>
                    <li>회원은 관계법, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.</li>
                </ol>
                
                <h4>제6조 (회원의 게시물)</h4>
                <ol>
                    <li>회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.</li>
                    <li>회원이 서비스 내에 게시하는 게시물은 검색결과 내지 서비스 및 관련 프로모션 등에 노출될 수 있으며, 해당 노출을 위해 필요한 범위 내에서는 일부 수정, 복제, 편집되어 게시될 수 있습니다. 이 경우, 회사는 저작권법 규정을 준수하며, 회원은 언제든지 고객센터 또는 서비스 내 관리기능을 통해 해당 게시물에 대해 삭제, 검색결과 제외, 비공개 등의 조치를 취할 수 있습니다.</li>
                    <li>회사는 회원의 게시물이 "정보통신망법" 및 "저작권법"등 관련법에 위반되는 내용을 포함하는 경우, 권리자는 관련법이 정한 절차에 따라 해당 게시물의 게시중단 및 삭제 등을 요청할 수 있으며, 회사는 관련법에 따라 조치를 취하여야 합니다.</li>
                </ol>

                <h4>제7조 (면책조항)</h4>
                <ol>
                    <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                    <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
                    <li>회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</li>
                    <li>본 서비스에서 제공하는 정보 및 조언은 일반적인 참고자료이며, 전문적인 의학적 진단이나 치료를 대체할 수 없습니다. 심리적 어려움이 지속될 경우 반드시 전문가와 상담하시기 바랍니다.</li>
                </ol>
                
                <h4>제8조 (준거법 및 재판관할)</h4>
                <ol>
                    <li>회사와 회원 간에 발생한 분쟁에 대하여는 대한민국법을 준거법으로 합니다.</li>
                    <li>회사와 회원간 발생한 분쟁에 관한 소송은 민사소송법 상의 관할법원에 제소합니다.</li>
                </ol>

                <p>부칙: 본 약관은 2024년 6월 13일부터 시행됩니다.</p>
            </div>
        </div>
    `
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal(modal.querySelector('.modal-close'));
    }
  });
  document.body.appendChild(modal)
  modal.style.display = "block"
}

// 유틸리티 함수들
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentDate() {
  // 이 함수는 이제 formatDate로 대체될 수 있으나, 기존 사용처가 있다면 유지
  return new Date().toISOString().split("T")[0]
}

function getRandomItem(array) {
  if (!array || array.length === 0) return null; // 배열이 비어있거나 null이면 null 반환
  return array[Math.floor(Math.random() * array.length)]
}

// 로컬 스토리지 헬퍼 함수들
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("로컬 스토리지 저장 실패:", error)
    return false
  }
}

function loadFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("로컬 스토리지 로드 실패:", error)
    return null
  }
}

// Firestore 헬퍼 함수들
async function saveToFirestore(collectionName, docId, data) {
  if (!currentUser || !currentUser.uid) {
    // showMessage("로그인이 필요합니다.", "error"); // 이 함수를 호출하는 곳에서 로그인 여부 먼저 체크
    return false;
  }
  try {
    await db
      .collection(collectionName) // 매개변수 사용
      .doc(docId)
      .set({
        ...data,
        userId: currentUser.uid, // 항상 userId 추가
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    // showMessage("데이터가 저장되었습니다.", "success"); // 호출하는 곳에서 메시지 처리
    return true;
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
    showMessage("데이터 저장 중 오류가 발생했습니다.", "error");
    return false;
  }
}

async function loadFromFirestore(collectionName, docId) {
  if (!currentUser || !currentUser.uid) return null;
  try {
    const docRef = db.collection(collectionName).doc(docId);
    const doc = await docRef.get();
    if (doc.exists && doc.data().userId === currentUser.uid) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error("Firestore 로드 실패:", error);
    return null;
  }
}

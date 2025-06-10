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
  storageBucket: "emoticare-n.appspot.com", // .firebasestorage.app 대신 .appspot.com을 사용하는 경우가 일반적입니다. 확인해주세요.
  messagingSenderId: "699658778766",
  appId: "1:699658778766:web:c5eaf7c7f1832b3c3671df",
  measurementId: "G-QPTE3B8E8V" // measurementId도 추가했습니다.
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig); // compat 버전 사용 시
const auth = firebase.auth(); // compat 버전 사용 시
const db = firebase.firestore(); // compat 버전 사용 시

// 현재 사용자
let currentUser = null;

// DOM 로드 완료 시 실행
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and parsed. Initializing common scripts.");
  const mainElement = document.querySelector('main');

  if (mainElement) {
    mainElement.style.opacity = '0'; // 메인 콘텐츠 초기에 숨기기
  }

  // 헤더와 푸터를 병렬로 로드하고 모두 완료될 때까지 기다림
  const headerPromise = loadHeader();
  const footerPromise = loadFooter();

  await Promise.all([headerPromise, footerPromise]);

  setupAuth(); // 인증 설정 (헤더/푸터 로드 후 또는 병행 가능)

  if (mainElement) {
    requestAnimationFrame(() => { // 브라우저가 다음 프레임을 그릴 준비가 되면 실행
        mainElement.style.opacity = '1'; // 메인 콘텐츠 부드럽게 표시
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
  // CSS에서 min-height로 공간을 확보하므로, JS에서 로딩 메시지 삽입 불필요

  try {
    const response = await fetch("header.html");
    if (!response.ok) {
      console.error(`Failed to fetch header.html: ${response.status} ${response.statusText}`);
      headerContainer.innerHTML = `<p style="color:red; text-align:center; padding:10px;">Error: Could not load header (${response.status}).</p>`;
      return;
    }
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML; // Inject header content

    // Now that header HTML is in the DOM, setup its components
    setupMobileMenu();
    setActiveNavItem();
    updateAuthUI(currentUser); // Update based on current auth state (might be null initially)
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
  // CSS에서 min-height로 공간을 확보하므로, JS에서 로딩 메시지 삽입 불필요

  try {
    const response = await fetch("footer.html");
    if (!response.ok) {
      console.error(`Failed to fetch footer.html: ${response.status} ${response.statusText}`);
      footerContainer.innerHTML = `<p style="color:red; text-align:center; padding:10px;">Error: Could not load footer (${response.status}).</p>`;
      return;
    }
    const footerHTML = await response.text();
    footerContainer.innerHTML = footerHTML; // Inject footer content
    // 푸터 로드 후 현재 연도 설정
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
      const icon = this.querySelector("i")
      if (navMenu.classList.contains("active")) {
        icon.classList.replace("fa-bars", "fa-times");
      } else {
        icon.classList.replace("fa-times", "fa-bars");
      }
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
    currentUser = user
    updateAuthUI(user)
  });
}

// 인증 UI 업데이트
function updateAuthUI(user) {
  const loginButtonContainer = document.getElementById("loginButtonContainer")
  if (!loginButtonContainer) return;

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
                <button type="submit" class="btn-primary">로그인</button>
                <p class="mt-2 text-center">
                    계정이 없으신가요? <a href="#" onclick="switchToSignupModal()">회원가입</a>
                </p>
            </form>
        </div>
    `

  document.body.appendChild(modal)
  modal.style.display = "block"

  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // 모달 외부 클릭 시 닫기
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal(modal.querySelector('.modal-close'));
    }
  });
}

// 회원가입 모달 표시
function showSignupModal() {
  const modal = document.createElement("div")
  modal.className = "modal"
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
                <button type="submit" class="btn-primary">회원가입</button>
                <p class="mt-2 text-center">
                    이미 계정이 있으신가요? <a href="#" onclick="switchToLoginModal()">로그인</a>
                </p>
            </form>
        </div>
    `

  document.body.appendChild(modal)
  modal.style.display = "block"

  document.getElementById("signupForm").addEventListener("submit", handleSignup);

  // 모달 외부 클릭 시 닫기
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
      case 'auth/invalid-email':
        errorMessage = "유효하지 않은 이메일 주소입니다.";
        break;
      case 'auth/user-disabled':
        errorMessage = "사용 중지된 계정입니다.";
        break;
      case 'auth/user-not-found':
        errorMessage = "존재하지 않는 사용자입니다.";
        break;
      case 'auth/wrong-password':
        errorMessage = "잘못된 비밀번호입니다.";
        break;
      case 'auth/too-many-requests':
        errorMessage = "너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.";
        break;
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
    // 필요시 바로 로그인 처리: updateAuthUI(userCredential.user);
  } catch (error) {
    let errorMessage = "회원가입 실패: 알 수 없는 오류가 발생했습니다.";
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "이미 사용 중인 이메일 주소입니다.";
        break;
      case 'auth/invalid-email':
        errorMessage = "유효하지 않은 이메일 주소입니다.";
        break;
      case 'auth/weak-password':
        errorMessage = "비밀번호는 6자 이상이어야 합니다.";
        break;
    }
    showMessage(errorMessage, "error");
  }
}

// 로그아웃
async function logout() {
  try {
    await auth.signOut();
    showMessage("로그아웃되었습니다.", "success");
  } catch (error) {
    showMessage("로그아웃 실패: " + error.message, "error");
  }
}

// 모달 닫기
function closeModal(element) {
  const modal = element.closest(".modal")
  modal.remove()
  // document.body.style.overflow = 'auto'; // 스크롤 복원
}

// 모든 모달 닫기
function closeAllModals() {
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => modal.remove())
  // document.body.style.overflow = 'auto'; // 스크롤 복원
}

// 메시지 표시
function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message
  messageDiv.style.position = "fixed"
  messageDiv.style.top = "20px"
  messageDiv.style.right = "20px"
  messageDiv.style.zIndex = "3000"
  messageDiv.style.maxWidth = "350px"
  messageDiv.style.padding = "1rem"; // 패딩 추가

  document.body.appendChild(messageDiv)

  setTimeout(() => {
    messageDiv.remove()
  }, 3000)
} 

// 개인정보처리방침 표시
function showPrivacyPolicy() {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>개인정보처리방침</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <p>EmotiCare는 사용자의 개인정보를 소중히 여기며, 관련 법령에 따라 개인정보를 보호합니다.</p>
                <h4>1. 수집하는 개인정보</h4>
                <p>- 이메일 주소, 이름, 감정 기록 데이터</p>
                <h4>2. 개인정보의 이용목적</h4>
                <p>- 서비스 제공 및 개선, 사용자 지원</p>
                <h4>3. 개인정보의 보유 및 이용기간</h4>
                <p>- 회원 탈퇴 시까지 또는 법령에서 정한 기간</p>
                <p>더 자세한 내용은 개인정보처리방침 전문을 참고해주시기 바랍니다.</p>
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
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>이용약관</h3>
                <button class="modal-close" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <h4>제1조 (목적)</h4>
                <p>본 약관은 EmotiCare 서비스 이용에 관한 조건 및 절차를 규정함을 목적으로 합니다.</p>
                <h4>제2조 (서비스의 내용)</h4>
                <p>회사는 감정 기록, 힐링 콘텐츠 제공 등의 서비스를 제공합니다.</p>
                <h4>제3조 (이용자의 의무)</h4>
                <p>이용자는 서비스를 선량한 목적으로 이용해야 하며, 타인에게 피해를 주어서는 안 됩니다.</p>
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
  return date.toISOString().split("T")[0]
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0]
}

function getRandomItem(array) {
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
async function saveToFirestore(collection, docId, data) {
  if (!currentUser || !currentUser.uid) { // uid 존재 여부도 확인
    showMessage("로그인이 필요합니다.", "error")
    return false
  }

  try {
    await db
      .collection(collection)
      .doc(docId)
      .set({
        ...data,
        userId: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }); // merge: true 옵션으로 기존 문서에 병합
    return true
  } catch (error) {
    console.error("Firestore 저장 실패:", error)
    showMessage("데이터 저장에 실패했습니다.", "error")
    return false
  }
}

async function loadFromFirestore(collection, docId) {
  if (!currentUser || !currentUser.uid) return null; // uid 존재 여부도 확인

  try {
    const doc = await db.collection(collection).doc(docId).get()
    if (doc.exists && doc.data().userId === currentUser.uid) {
      return doc.data();
    }
    return null
  } catch (error) {
    console.error("Firestore 로드 실패:", error)
    return null
  }
}
